// NFR-8: every screen carries a visible prototype marker. It lives in the
// header as a pill so it is always on screen without shouting.
export function PrototypeBanner() {
  return (
    <div
      className="proto-pill"
      role="note"
      aria-label="Prototype notice"
      title="Runs off a static data file. No backend, no network calls, nothing leaves this browser tab."
    >
      <span className="proto-dot" aria-hidden="true" />
      Prototype — not connected to any Google system
    </div>
  );
}
