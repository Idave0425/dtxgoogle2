import { Fragment } from 'react';
import type {
  AttributeKey,
  DuplicateCluster,
  MatchResult,
  StepDefinition,
} from '../../types';
import { useAppState, useDispatch } from '../../state/context';
import {
  selectPartByGpn,
  selectSteps,
  selectVolume,
} from '../../state/selectors';
import { compareAttribute, labelFor } from '../../engine/match';
import { TIER_LABEL } from '../../engine/volume';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import { VerdictBadge } from '../common/VerdictBadge';
import { TierTag, VolumeCell } from '../volume/VolumeCell';
import { DuplicateNotice } from './DuplicateNotice';
import { Icon, VerdictMark } from '../common/Icon';
import { clusterLabel } from './clusterLabel';

interface Props {
  rows: MatchResult[];
  columns: StepDefinition[];
  clustersByGpn: Map<string, DuplicateCluster[]>;
  preferred: string | null;
  maxVolume: number;
  expanded: Set<string>;
  onToggle: (gpn: string) => void;
  emptyText: string;
}

function formatValue(v: string | number | null, unit?: 'mm'): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return `${v}${unit === 'mm' ? ' mm' : ''}`;
  return String(v);
}

export function ResultsTable({
  rows,
  columns,
  clustersByGpn,
  preferred,
  maxVolume,
  expanded,
  onToggle,
  emptyText,
}: Props) {
  const state = useAppState();
  const dispatch = useDispatch();
  const allSteps = selectSteps(state).filter(
    (s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY
  );

  function askedLabel(col: StepDefinition): { text: string; cls: string } {
    const a = state.query.answers[col.key];
    if (!a || a.state === 'pending') return { text: 'not asked', cls: 'ask-none' };
    if (a.state === 'skipped') return { text: 'skipped', cls: 'ask-skip' };
    return { text: formatValue(a.value, col.unit), cls: 'ask-set' };
  }

  function cellFor(result: MatchResult, col: StepDefinition) {
    const found = (result.part.attributes as any)[col.key] as string | number | null;
    const cmp = compareAttribute(col.key, state.query.answers[col.key], found);
    const display = cmp.verdict === 'unknown' ? "doesn't say" : formatValue(found, col.unit);
    return (
      <td
        key={col.key as string}
        className={`rt-cell rt-${cmp.verdict}`}
        title={`${labelFor(col.key)}: ${display}`}
      >
        <VerdictMark verdict={cmp.verdict} />
        <span className="rt-val">{display}</span>
      </td>
    );
  }

  const totalCols = 6 + columns.length;

  return (
    <div className="table-wrap panel">
      <table className="results-table">
        <thead>
          <tr>
            <th className="col-check" aria-label="Compare" />
            <th className="col-gpn">GPN</th>
            <th className="col-verdict">Verdict</th>
            <th className="col-phase">Lifecycle</th>
            <th className="col-vol num">Volume, pcs / yr</th>
            {columns.map((c) => {
              const ask = askedLabel(c);
              return (
                <th key={c.key as string} className={`col-attr ${ask.cls}`} scope="col">
                  <div className="th-prompt">{labelFor(c.key)}</div>
                  <div className="th-asked">{ask.text}</div>
                </th>
              );
            })}
            <th className="col-expand" aria-label="Details" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="empty-cell">
                {emptyText}
              </td>
            </tr>
          ) : null}
          {rows.map((r) => {
            const gpn = r.part.gpn;
            const isExpanded = expanded.has(gpn);
            const checked = state.compareGpns.includes(gpn);
            const myClusters = clustersByGpn.get(gpn) ?? [];
            const vol = selectVolume(gpn);
            return (
              <Fragment key={gpn}>
                <tr
                  id={`row-${gpn}`}
                  className={`row-result row-${r.verdict}${isExpanded ? ' is-expanded' : ''}${
                    gpn === preferred ? ' is-preferred' : ''
                  }${checked ? ' is-checked' : ''}`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('input,button')) return;
                    onToggle(gpn);
                  }}
                >
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={`Select ${gpn} for compare`}
                      onChange={() => dispatch({ type: 'TOGGLE_COMPARE', gpn })}
                    />
                  </td>
                  <td className="col-gpn">
                    <button
                      className="gpn-btn mono"
                      onClick={() => onToggle(gpn)}
                      aria-expanded={isExpanded}
                    >
                      {gpn}
                    </button>
                    {r.exclusionReason ? (
                      <span className="row-reason">{r.exclusionReason}</span>
                    ) : null}
                    <span className="tags">
                      {gpn === preferred ? (
                        <span className="tag tag-preferred">
                          <Icon name="star" size={12} /> Preferred
                        </span>
                      ) : null}
                      <TierTag gpn={gpn} />
                      {myClusters.map((c) => {
                        const label = clusterLabel(
                          c,
                          c.gpns.map((g) => selectPartByGpn(g)!).filter(Boolean)
                        );
                        return (
                          <span key={c.id} className={`tag tag-${label.kind}`}>
                            {label.short}
                          </span>
                        );
                      })}
                    </span>
                  </td>
                  <td className="col-verdict">
                    <VerdictBadge verdict={r.verdict} />
                  </td>
                  <td className="col-phase">
                    <span className={`phase phase-${r.part.phase.replace(/\s+/g, '-').toLowerCase()}`}>
                      {r.part.phase}
                    </span>
                  </td>
                  <td className="col-vol">
                    <VolumeCell gpn={gpn} max={maxVolume} />
                  </td>
                  {columns.map((c) => cellFor(r, c))}
                  <td className="col-expand">
                    <button
                      className="expand-btn"
                      onClick={() => onToggle(gpn)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? 'Hide details' : 'Show details'}
                    >
                      <Icon name="chevron" />
                    </button>
                  </td>
                </tr>
                {isExpanded ? (
                  <tr className="row-detail">
                    <td colSpan={totalCols}>
                      <div className="detail-grid">
                        <div className="detail-main">
                          <h4>Description</h4>
                          <blockquote>“{r.part.description}”</blockquote>
                          {r.verdict === 'near' ? (
                            <p className="detail-callout callout-near">
                              <strong>Close match.</strong>{' '}
                              {r.comparisons
                                .filter((c) => c.verdict === 'near')
                                .map(
                                  (c) =>
                                    `${labelFor(c.key)} is ${formatValue(c.found, 'mm')}, you asked ${formatValue(c.asked, 'mm')}`
                                )
                                .join('; ')}
                              . Within tolerance, so it's shown for you to decide.
                            </p>
                          ) : null}
                          {r.unknownKeys.length > 0 ? (
                            <p className="detail-callout callout-review">
                              <strong>Needs review.</strong> The description doesn't
                              state{' '}
                              {r.unknownKeys.map((k) => labelFor(k as AttributeKey)).join(', ')}.
                              Confirm against a catalogue page before reusing.
                            </p>
                          ) : null}
                          <p className="detail-sources muted small">
                            {r.part.sources.map((s) => `${s.sheet} r${s.row}`).join(' · ')}
                            {r.part.packaging.isKit ? ' · kit' : ''}
                            {r.part.packaging.quantity ? ` · ${r.part.packaging.quantity}-pack` : ''}
                          </p>
                        </div>
                        <div className="detail-side">
                          <h4>Volume</h4>
                          {vol.record ? (
                            <dl className="detail-dl">
                              <div><dt>Annual qty</dt><dd>{vol.record.annualQty.toLocaleString()} pcs</dd></div>
                              <div><dt>Orders / yr</dt><dd>{vol.record.orders ?? '—'}</dd></div>
                              <div><dt>Tier</dt><dd>{TIER_LABEL[vol.tier]}</dd></div>
                            </dl>
                          ) : (
                            <p className="muted small">No order data for this GPN yet.</p>
                          )}
                          <h4>Manufacturers</h4>
                          {r.part.manufacturers.length > 0 ? (
                            <ul className="mfr-list">
                              {r.part.manufacturers.slice(0, 8).map((m, i) => (
                                <li key={i}>
                                  <span>{m.name || 'unknown vendor'}</span>
                                  <code>{m.partNumber || '—'}</code>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="muted small">None listed.</p>
                          )}
                        </div>
                        <div className="detail-attrs">
                          <h4>All attributes</h4>
                          <dl className="detail-dl">
                            {allSteps.map((s) => {
                              const found = (r.part.attributes as any)[s.key];
                              const cmp = compareAttribute(s.key, state.query.answers[s.key], found);
                              return (
                                <div key={s.key as string} className={`dl-${cmp.verdict}`}>
                                  <dt>{labelFor(s.key)}</dt>
                                  <dd>
                                    {found === null || found === undefined
                                      ? "doesn't say"
                                      : formatValue(found, s.unit)}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        </div>
                      </div>
                      {myClusters.map((c) => (
                        <DuplicateNotice key={c.id} cluster={c} currentGpn={gpn} />
                      ))}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="table-foot">
        <span className="legend">
          <span><VerdictMark verdict="match" /> states your value</span>
          <span><VerdictMark verdict="near" /> close</span>
          <span><VerdictMark verdict="unknown" /> doesn't say</span>
          <span><VerdictMark verdict="differs" /> states a different value</span>
        </span>
        {rows.some((r) => !selectVolume(r.part.gpn).record) ? (
          <span className="muted small">
            Pending volume has no order data yet and ranks after known volume.
          </span>
        ) : null}
      </div>
    </div>
  );
}
