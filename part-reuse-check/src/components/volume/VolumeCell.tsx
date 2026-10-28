// Volume display. Week 3 feedback: rank by volume, highlight high runners,
// and say "volume pending" rather than invent a number.

import { formatQty, TIER_LABEL } from '../../engine/volume';
import { selectVolume, selectVolumeSource } from '../../state/selectors';

/** Bar + quantity, scaled against `max` (the largest volume on screen). */
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
      <span className="vol-num">{formatQty(record.annualQty)}</span>
    </span>
  );
}

export function TierTag({ gpn }: { gpn: string }) {
  const { tier } = selectVolume(gpn);
  if (tier !== 'high-runner') return null;
  return <span className="tag tag-runner">High runner</span>;
}

/** One line telling the engineer where volume numbers come from. */
export function VolumeSourceNote() {
  const source = selectVolumeSource();
  if (source === 'vendor') return null;
  return source === 'sample' ? (
    <p className="source-note source-sample" role="note">
      <strong>Sample volumes.</strong> Proof-of-concept data attached to the demo
      dataset, not real order history. It shows how volume ranking, preferred
      parts and pack-variant totals will work once vendor data arrives.
    </p>
  ) : (
    <p className="source-note source-none" role="note">
      <strong>Volume pending.</strong> Vendor order data hasn't arrived yet.
      Results are ranked by match quality and lifecycle; volume will slot in
      once data is loaded.
    </p>
  );
}
