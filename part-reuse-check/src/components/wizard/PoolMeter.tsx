// FR-7: the pool is shown as two (now three) numbers, never one. The bar makes
// the gap between "states your value" and "doesn't say" visible at a glance.

export function PoolMeter({
  exact,
  near,
  unknown,
}: {
  exact: number;
  near: number;
  unknown: number;
}) {
  const total = exact + near + unknown;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className="pool" aria-live="polite">
      <div className="pool-bar" aria-hidden="true">
        <span className="pool-seg seg-exact" style={{ width: `${pct(exact)}%` }} />
        <span className="pool-seg seg-near" style={{ width: `${pct(near)}%` }} />
        <span className="pool-seg seg-unknown" style={{ width: `${pct(unknown)}%` }} />
      </div>
      <div className="pool-legend">
        <span>
          <i className="dot dot-exact" />
          <strong>{exact}</strong> state your values
        </span>
        {near > 0 ? (
          <span>
            <i className="dot dot-near" />
            <strong>{near}</strong> close
          </span>
        ) : null}
        <span>
          <i className="dot dot-unknown" />
          <strong>{unknown}</strong> don't say
        </span>
      </div>
    </div>
  );
}
