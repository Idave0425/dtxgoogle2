import type { ResultVerdict } from '../../types';

const LABEL: Record<ResultVerdict, string> = {
  match: 'Match',
  near: 'Close match',
  review: 'Needs review',
  different: 'Different',
};

export function VerdictBadge({ verdict }: { verdict: ResultVerdict }) {
  return (
    <span
      className={`verdict verdict-${verdict}`}
      aria-label={`Verdict: ${LABEL[verdict]}`}
    >
      <span className="verdict-dot" aria-hidden="true" />
      {LABEL[verdict]}
    </span>
  );
}
