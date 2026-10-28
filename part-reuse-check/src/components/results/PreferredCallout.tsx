// The "check before you create" nudge: point at the part Google actually buys.

import { useAppState } from '../../state/context';
import { formatQty } from '../../engine/volume';
import {
  selectPreferredGpn,
  selectVolume,
  selectVolumeSource,
} from '../../state/selectors';
import { VerdictBadge } from '../common/VerdictBadge';

export function PreferredCallout({ onReveal }: { onReveal: (gpn: string) => void }) {
  const state = useAppState();
  const gpn = selectPreferredGpn(state);
  if (!gpn) return null;
  const result = state.results!.find((r) => r.part.gpn === gpn)!;
  const vol = selectVolume(gpn).record!;
  const source = selectVolumeSource();

  // How much more this part is ordered than the next-best match.
  const others = state.results!
    .filter((r) => r.part.gpn !== gpn && (r.verdict === 'match' || r.verdict === 'near'))
    .map((r) => selectVolume(r.part.gpn).record?.annualQty ?? 0);
  const runnerUp = Math.max(0, ...others);
  const ratio = runnerUp > 0 ? vol.annualQty / runnerUp : null;

  return (
    <section className="preferred card" aria-label="Preferred part">
      <div className="preferred-icon" aria-hidden="true">★</div>
      <div className="preferred-body">
        <div className="preferred-kicker">
          Preferred part{source === 'sample' ? ' · proof-of-concept volume' : ''}
        </div>
        <div className="preferred-title">
          <span className="mono">{gpn}</span>
          <VerdictBadge verdict={result.verdict} />
          <span className="muted">{result.part.phase}</span>
        </div>
        <p className="preferred-desc">“{result.part.description}”</p>
        <p className="preferred-why">
          The most-ordered part among your matches:{' '}
          <strong>{formatQty(vol.annualQty)} pcs / yr</strong>
          {ratio && ratio >= 1.2
            ? `, about ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× the next option`
            : ''}
          . Reusing high runners keeps volume pooled and unit cost down.
          {result.verdict === 'near'
            ? ' It is a close match, not exact. Check the highlighted size works for you.'
            : ''}
        </p>
      </div>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onReveal(gpn)}
      >
        View details
      </button>
    </section>
  );
}
