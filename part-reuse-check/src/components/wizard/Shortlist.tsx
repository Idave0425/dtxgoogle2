// The live shortlist: the parts that already fit, ranked as the results will
// be, updating with every answer. It shows the engineer, before they finish,
// that an existing GPN is likely there.

import { useAppState } from '../../state/context';
import { selectMaxVolume, selectShortlist, selectVolume } from '../../state/selectors';
import { formatQty } from '../../engine/volume';
import { VerdictBadge } from '../common/VerdictBadge';

export function Shortlist() {
  const state = useAppState();
  const { total, rows } = selectShortlist(state, 5);
  const max = selectMaxVolume(rows.map((r) => r.part.gpn));

  return (
    <section className="panel shortlist" aria-label="Parts that fit so far">
      <header className="panel-head">
        <h2>Already in the catalogue</h2>
        {total > 0 ? <span className="muted num">{total} fit · pcs / yr</span> : null}
      </header>
      {rows.length === 0 ? (
        <p className="empty-line">
          {!state.query.answers.family
            ? 'Pick a fastener type to see which parts already exist.'
            : 'Nothing fits these answers. Try skipping the last one.'}
        </p>
      ) : (
        <ol className="shortlist-rows">
          {rows.map((r) => {
            const v = selectVolume(r.part.gpn).record;
            const pct = v && max ? Math.max(3, (v.annualQty / max) * 100) : 0;
            return (
              <li key={r.part.gpn}>
                <div className="sl-line1">
                  <span className="mono">{r.part.gpn}</span>
                  <VerdictBadge verdict={r.verdict} />
                  <span className="sl-vol num">{v ? formatQty(v.annualQty) : '—'}</span>
                </div>
                <div className="sl-line2">
                  <span className="sl-desc">{r.part.description}</span>
                </div>
                <span className="sl-bar" aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {total > rows.length ? (
        <p className="panel-foot muted">+{total - rows.length} more</p>
      ) : null}
    </section>
  );
}
