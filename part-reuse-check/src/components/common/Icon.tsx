// One outline icon set, 1.5px stroke, drawn inline so the app stays offline.

const PATHS = {
  check: 'M3.5 8.5l3 3 6-7',
  cross: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
  approx: 'M3 6.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0M3 10.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0',
  unknown: 'M6 6a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3v.4M8 11.8v.2',
  dot: 'M7.2 8a.8.8 0 1 0 1.6 0 .8.8 0 1 0-1.6 0',
  search: 'M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM10.6 10.6L14 14',
  list: 'M5.5 4.5h8M5.5 8h8M5.5 11.5h8M2.5 4.5h.5M2.5 8h.5M2.5 11.5h.5',
  columns: 'M2.5 3.5h11v9h-11zM8 3.5v9',
  flag: 'M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8',
  chevron: 'M4.5 6.5L8 10l3.5-3.5',
  copy: 'M5.5 5.5h7v8h-7zM3.5 10.5v-8h7',
  star: 'M8 2.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8L8 11.1l-3.4 1.8.7-3.8-2.8-2.6 3.8-.5z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      className={`icon icon-${name}`}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/** Per-cell verdict mark: a glyph in the verdict's ink, never a tinted box. */
export function VerdictMark({ verdict }: { verdict: 'match' | 'near' | 'differs' | 'unknown' | 'not-asked' }) {
  const name: IconName =
    verdict === 'match' ? 'check' : verdict === 'near' ? 'approx' : verdict === 'differs' ? 'cross' : verdict === 'unknown' ? 'unknown' : 'dot';
  return (
    <span className={`mark mark-${verdict}`}>
      <Icon name={name} size={14} />
    </span>
  );
}
