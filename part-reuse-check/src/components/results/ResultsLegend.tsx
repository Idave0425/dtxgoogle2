const ITEMS = [
  { cls: 'rt-match', mark: '✓', text: 'matches' },
  { cls: 'rt-near', mark: '≈', text: 'close' },
  { cls: 'rt-unknown', mark: '?', text: "doesn't say" },
  { cls: 'rt-not-asked', mark: '·', text: 'not asked' },
];

export function ResultsLegend() {
  return (
    <div className="legend" role="note" aria-label="Cell key">
      {ITEMS.map((i) => (
        <span key={i.cls} className={`legend-item ${i.cls}`}>
          <span className="rt-mark" aria-hidden="true">{i.mark}</span>
          {i.text}
        </span>
      ))}
    </div>
  );
}
