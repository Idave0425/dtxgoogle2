import { useState } from 'react';
import type { MatchResult } from '../../types';

export function ExcludedSummary({ excluded }: { excluded: MatchResult[] }) {
  const [open, setOpen] = useState(false);
  if (excluded.length === 0) return null;
  return (
    <div className="excluded card">
      <button
        className="excluded-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`chev${open ? ' is-open' : ''}`} aria-hidden="true">›</span>
        {excluded.length} part{excluded.length === 1 ? '' : 's'} excluded because
        they state a different value
      </button>
      {open ? (
        <ul className="excluded-list">
          {excluded.map((r) => (
            <li key={r.part.gpn}>
              <span className="mono">{r.part.gpn}</span>
              <span className="muted">{r.exclusionReason}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
