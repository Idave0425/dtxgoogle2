// Signature element: where this spec's order volume goes. One spec spread over
// several GPNs is exactly the consolidation case Google asked about; the strip
// shows it at a glance, with the preferred part in the one data hue.

import type { MatchResult } from '../../types';
import { formatQty } from '../../engine/volume';
import { selectVolume } from '../../state/selectors';

export function VolumeShare({ rows, preferred }: { rows: MatchResult[]; preferred: string | null }) {
  const parts = rows
    .filter((r) => r.verdict === 'match' || r.verdict === 'near')
    .map((r) => ({ gpn: r.part.gpn, qty: selectVolume(r.part.gpn).record?.annualQty ?? null }))
    .filter((p): p is { gpn: string; qty: number } => p.qty !== null && p.qty > 0)
    .sort((a, b) => b.qty - a.qty);
  if (parts.length < 2) return null;
  const total = parts.reduce((s, p) => s + p.qty, 0);
  const pending = rows.filter(
    (r) => (r.verdict === 'match' || r.verdict === 'near') && !selectVolume(r.part.gpn).record
  ).length;

  return (
    <section className="panel share" aria-label="Volume share">
      <header className="panel-head">
        <h2>Where this part's volume goes</h2>
        <span className="muted num">
          {parts.length} GPNs · {formatQty(total)} pcs / yr
          {pending ? ` · ${pending} pending` : ''}
        </span>
      </header>
      <div className="share-bar" role="img" aria-label="Share of annual volume by GPN">
        {parts.map((p) => (
          <span
            key={p.gpn}
            className={`share-seg${p.gpn === preferred ? ' is-preferred' : ''}`}
            style={{ flexGrow: p.qty }}
            title={`${p.gpn}: ${p.qty.toLocaleString()} pcs / yr (${Math.round((p.qty / total) * 100)}%)`}
          />
        ))}
      </div>
      <ol className="share-legend">
        {parts.slice(0, 4).map((p) => (
          <li key={p.gpn} className={p.gpn === preferred ? 'is-preferred' : ''}>
            <span className="mono">{p.gpn}</span>
            <span className="num">{Math.round((p.qty / total) * 100)}%</span>
          </li>
        ))}
        {parts.length > 4 ? (
          <li className="muted">
            <span>{parts.length - 4} others</span>
            <span className="num">
              {Math.round((parts.slice(4).reduce((s, p) => s + p.qty, 0) / total) * 100)}%
            </span>
          </li>
        ) : null}
      </ol>
    </section>
  );
}
