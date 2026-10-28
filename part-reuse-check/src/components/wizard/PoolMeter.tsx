// FR-7: the pool is never one number. Ink for parts that state your values,
// grey for close, a light grey for parts that don't say.

export function PoolMeter({ exact, near, unknown }: { exact: number; near: number; unknown: number }) {
  const total = exact + near + unknown;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <div className="pool" aria-live="polite">
      <div className="pool-bar" aria-hidden="true">
        <span className="seg seg-exact" style={{ width: `${pct(exact)}%` }} />
        <span className="seg seg-near" style={{ width: `${pct(near)}%` }} />
        <span className="seg seg-unknown" style={{ width: `${pct(unknown)}%` }} />
      </div>
      <div className="pool-legend">
        <span><i className="key key-exact" /><b className="num">{exact}</b> state your values</span>
        {near > 0 ? <span><i className="key key-near" /><b className="num">{near}</b> close</span> : null}
        <span><i className="key key-unknown" /><b className="num">{unknown}</b> don't say</span>
      </div>
    </div>
  );
}
