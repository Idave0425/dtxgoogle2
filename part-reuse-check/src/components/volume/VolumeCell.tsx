// Volume display. Rank by volume, mark high runners, and say "pending"
// rather than invent a number.

import { formatQty, TIER_LABEL } from '../../engine/volume';
import { selectVolume } from '../../state/selectors';

/** Right-aligned quantity with a thin bar in the one data hue, scaled to `max`. */
export function VolumeCell({ gpn, max }: { gpn: string; max: number }) {
  const { record, tier } = selectVolume(gpn);
  if (!record) {
    return (
      <span className="vol vol-pending" title="No order data for this GPN yet">
        pending
      </span>
    );
  }
  const pct = max > 0 ? Math.max(3, Math.round((record.annualQty / max) * 100)) : 0;
  return (
    <span
      className={`vol vol-${tier}`}
      title={`${record.annualQty.toLocaleString()} pcs / yr${
        record.orders !== null ? ` · ${record.orders} orders` : ''
      } · ${TIER_LABEL[tier]}`}
    >
      <span className="vol-bar" aria-hidden="true">
        <span className="vol-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="vol-num num">{formatQty(record.annualQty)}</span>
    </span>
  );
}

export function TierTag({ gpn }: { gpn: string }) {
  const { tier } = selectVolume(gpn);
  if (tier !== 'high-runner') return null;
  return <span className="tag">High runner</span>;
}
