import { useAppState, useDispatch } from '../../state/context';
import { selectSteps, selectVolume } from '../../state/selectors';
import { formatQty } from '../../engine/volume';
import { labelFor } from '../../engine/match';
import { NewGpnRequest } from './NewGpnRequest';

export function DeadEndScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const attributes = steps.filter(
    (s) => s.key !== ('__scope__' as any) && s.key !== ('__review__' as any)
  );
  const answered = attributes.filter(
    (s) => state.query.answers[s.key]?.state === 'answered'
  );

  const nearMisses = (state.results ?? []).filter((r) => r.verdict === 'different').slice(0, 10);

  return (
    <div className="dead-end">
      <header className="dead-head card">
        <div className="dead-icon" aria-hidden="true">∅</div>
        <div>
          <h2>No existing part matched</h2>
          <p className="muted">
            Nothing is close enough to review. Before requesting a new GPN, check
            the nearest misses below. Changing one attribute may be all it takes.
          </p>
        </div>
      </header>

      <section className="dead-search card">
        <h3>You searched for</h3>
        <ul>
          {answered.map((s) => {
            const a = state.query.answers[s.key]!;
            return (
              <li key={s.key as string}>
                <span className="dead-k">{labelFor(s.key)}:</span>{' '}
                <span className="dead-v">
                  {String(a.value) + (s.unit === 'mm' ? ' mm' : '')}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="dead-misses card">
        <h3>Nearest misses</h3>
        {nearMisses.length === 0 ? (
          <p>No candidates were close. The search even looked past the attributes you skipped.</p>
        ) : (
          <ul>
            {nearMisses.map((r) => (
              <li key={r.part.gpn}>
                <div className="miss-top">
                  <span className="mono">{r.part.gpn}</span>
                  <span className="chip chip-differs">{r.exclusionReason}</span>
                  <span className="muted small miss-vol">
                    {(() => {
                      const v = selectVolume(r.part.gpn).record;
                      return v ? `${formatQty(v.annualQty)} pcs / yr` : 'volume pending';
                    })()}
                  </span>
                </div>
                <span className="dead-desc">“{r.part.description}”</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NewGpnRequest />

      <footer className="dead-foot">
        <button
          className="btn btn-secondary"
          onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' })}
        >
          Change search
        </button>
        <button className="btn btn-primary" onClick={() => dispatch({ type: 'RESET' })}>
          Start over
        </button>
      </footer>
    </div>
  );
}
