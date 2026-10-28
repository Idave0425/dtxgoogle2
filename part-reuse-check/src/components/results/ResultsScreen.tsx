import { useMemo, useState } from 'react';
import type { ResultVerdict } from '../../types';
import { useAppState, useDispatch } from '../../state/context';
import {
  selectClustersForVisibleResults,
  selectMaxVolume,
  selectPreferredGpn,
  selectQuerySummary,
  selectSteps,
  selectVolume,
  selectVolumeSource,
} from '../../state/selectors';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import { labelFor } from '../../engine/match';
import { ResultsTable } from './ResultsTable';
import { VolumeShare } from './VolumeShare';
import { TitleRow } from '../shell/TitleRow';
import { CopyButton } from '../common/CopyButton';

type Tab = 'all' | ResultVerdict;
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All fits' },
  { id: 'match', label: 'Match' },
  { id: 'near', label: 'Close' },
  { id: 'review', label: 'Needs review' },
  { id: 'different', label: 'Excluded' },
];

export function ResultsScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const all = state.results ?? [];
  const fits = all.filter((r) => r.verdict !== 'different');
  const preferred = selectPreferredGpn(state);
  const [tab, setTab] = useState<Tab>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rows = tab === 'all' ? fits : all.filter((r) => r.verdict === tab);
  // Compare needs two parts that fit; with fewer there is nothing to compare.
  const canCompare = fits.length >= 2;
  const count = (t: Tab) => (t === 'all' ? fits.length : all.filter((r) => r.verdict === t).length);
  const maxVolume = selectMaxVolume(all.map((r) => r.part.gpn));

  const clusters = selectClustersForVisibleResults(state);
  const clustersByGpn = useMemo(() => {
    const m = new Map<string, typeof clusters>();
    for (const c of clusters) for (const g of c.gpns) m.set(g, [...(m.get(g) ?? []), c]);
    return m;
  }, [clusters]);

  const steps = selectSteps(state).filter(
    (s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY && s.key !== 'family'
  );
  // Only answered attributes get a column: a skipped one is "not asked" in every
  // row, and the sidebar already lists what was skipped.
  const answered = steps.filter((s) => state.query.answers[s.key]?.state === 'answered');
  const columns = answered.length ? answered : steps;

  // The finding: how many fit, and which one is ordered most.
  const top = preferred ?? fits[0]?.part.gpn ?? null;
  const pref = preferred ? fits.find((r) => r.part.gpn === preferred)! : null;
  const prefQty = preferred ? selectVolume(preferred).record!.annualQty : 0;
  const fitQty = fits
    .filter((r) => r.verdict === 'match' || r.verdict === 'near')
    .reduce((s, r) => s + (selectVolume(r.part.gpn).record?.annualQty ?? 0), 0);
  const nearNote = pref?.verdict === 'near'
    ? ` It's a close match: ${pref.comparisons
        .filter((c) => c.verdict === 'near')
        .map((c) => `${labelFor(c.key)} ${c.found} mm, you asked ${c.asked} mm`)
        .join('; ')}.`
    : '';
  const sub = (
    <>
      {fits.length} existing GPN{fits.length === 1 ? '' : 's'} fit this search.
      {pref ? (
        <>
          {' '}
          <strong className="mono">{preferred}</strong> is ordered most:{' '}
          <span className="num">{prefQty.toLocaleString()}</span> pcs / yr,{' '}
          <span className="num">{Math.round((prefQty / fitQty) * 100)}%</span> of the volume across
          the matches.{nearNote}
        </>
      ) : null}
    </>
  );

  return (
    <>
      <TitleRow
        title={<span className="query-title">{selectQuerySummary(state)}</span>}
        sub={sub}
        source={
          selectVolumeSource() === 'sample'
            ? 'Order volumes are proof-of-concept sample data. Real vendor volumes are pending from Google.'
            : selectVolumeSource() === 'none'
            ? 'Volume pending: waiting on vendor order data from Google.'
            : undefined
        }
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => dispatch({ type: 'RESET' })}>
              New search
            </button>
            {top ? <CopyButton text={top} label={`Copy ${top}`} primary /> : null}
          </>
        }
      />

      <VolumeShare rows={fits} preferred={preferred} />

      <div className="tabs" role="tablist" aria-label="Filter by verdict">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="tab-count num">{count(t.id)}</span>
          </button>
        ))}
        <span className="tabs-end">
          <span className="muted small">Sorted by match, lifecycle, volume</span>
          {canCompare ? (
            <button
              className="btn btn-secondary btn-sm"
              disabled={state.compareGpns.length !== 2}
              onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'compare' })}
              title={state.compareGpns.length !== 2 ? 'Tick two rows to compare them' : undefined}
            >
              Compare {state.compareGpns.length} of 2
            </button>
          ) : null}
        </span>
      </div>

      <ResultsTable
        rows={rows}
        columns={columns}
        clustersByGpn={clustersByGpn}
        preferred={preferred}
        selectable={canCompare}
        maxVolume={maxVolume}
        expanded={expanded}
        onToggle={(gpn) =>
          setExpanded((prev) => {
            const n = new Set(prev);
            if (n.has(gpn)) n.delete(gpn);
            else n.add(gpn);
            return n;
          })
        }
        emptyText={
          tab === 'near'
            ? 'No close matches. Close matches appear for lengths and washer sizes within about 3%.'
            : tab === 'different'
            ? 'Nothing was excluded by your answers.'
            : 'No parts in this view.'
        }
      />
    </>
  );
}
