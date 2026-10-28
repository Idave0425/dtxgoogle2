// The product's mark: a hex nut seen end-on, drawn for this tool.
export function ProductMark() {
  return (
    <svg className="product-mark" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M14 2.5l10 5.75v11.5L14 25.5 4 19.75V8.25z"
        fill="var(--text)"
      />
      <circle cx="14" cy="14" r="4.6" fill="var(--ground)" />
      <circle cx="14" cy="14" r="4.6" fill="none" stroke="var(--hue)" strokeWidth="1.6" />
    </svg>
  );
}
