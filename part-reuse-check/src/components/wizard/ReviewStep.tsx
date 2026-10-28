import { useAppState, useDispatch } from '../../state/context';
import { selectPoolCounts, selectSteps } from '../../state/selectors';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import { StepHeader } from './StepHeader';

export function ReviewStep() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const counts = selectPoolCounts(state);
  const attributeSteps = steps.filter(
    (s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY
  );

  return (
    <section className="panel step">
      <StepHeader
        index={state.stepIndex}
        total={steps.length}
        title="Review and search"
        help="Click any row to change it. Skipped attributes apply no filter."
      />

      <ul className="review-list">
        {attributeSteps.map((s, i) => {
          const a = state.query.answers[s.key];
          const status = a?.state ?? 'pending';
          const label =
            status === 'answered'
              ? String(a!.value) + (s.unit === 'mm' ? ' mm' : '')
              : status === 'skipped'
              ? 'Skipped'
              : 'Not answered';
          return (
            <li key={s.key as string} className={`review-row is-${status}`}>
              <button
                className="review-row-btn"
                onClick={() => dispatch({ type: 'GOTO_STEP', index: i })}
              >
                <span className="review-label">{s.prompt}</span>
                <span className="review-value">{label}</span>
                <span className="review-jump" aria-hidden="true">Edit</span>
              </button>
            </li>
          );
        })}
        <li className="review-row is-answered">
          <button
            className="review-row-btn"
            onClick={() => dispatch({ type: 'GOTO_STEP', index: steps.length - 2 })}
          >
            <span className="review-label">Scope</span>
            <span className="review-value">
              {state.query.scope.phases.join(', ')}
              {state.query.scope.allowKits ? ' · kits' : ''}
              {state.query.scope.strict ? ' · strict' : ''}
            </span>
            <span className="review-jump" aria-hidden="true">Edit</span>
          </button>
        </li>
      </ul>

      <footer className="step-footer">
        <p className="step-foot-note">
          <strong>{counts.total}</strong> candidate{counts.total === 1 ? '' : 's'}.
          Results are ranked by match quality, then lifecycle, then order volume.
        </p>
        <div className="step-controls">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BACK' })}>
            Back
          </button>
          <button
            className="btn btn-primary btn-lg"
            autoFocus
            onClick={() => dispatch({ type: 'RUN_SEARCH' })}
          >
            Search parts
          </button>
        </div>
      </footer>
    </section>
  );
}
