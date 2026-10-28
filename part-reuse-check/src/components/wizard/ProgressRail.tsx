import { useAppState, useDispatch } from '../../state/context';
import { selectFurthestReachable, selectSteps } from '../../state/selectors';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';

const SHORT: Record<string, string> = {
  family: 'Fastener type',
  threadSize: 'Thread size',
  threadPitchMm: 'Thread pitch',
  lengthMm: 'Length',
  headType: 'Head',
  driveType: 'Drive',
  material: 'Material',
  finish: 'Finish',
  integralWasher: 'Built-in washer',
  gradeClass: 'Grade',
  fitsScrewSize: 'Fits screw',
  innerDiameterMm: 'Inner diameter',
  outerDiameterMm: 'Outer diameter',
  thicknessMm: 'Thickness',
  washerStyle: 'Style',
  [SCOPE_STEP_KEY as string]: 'Scope',
  [REVIEW_STEP_KEY as string]: 'Review & search',
};

export function ProgressRail() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const furthest = selectFurthestReachable(state);

  return (
    <aside className="rail" aria-label="Steps">
      <h3 className="rail-title">Your search</h3>
      <ol className="rail-list">
        {steps.map((s, i) => {
          const a = state.query.answers[s.key];
          const isCurrent = i === state.stepIndex;
          let status: 'answered' | 'skipped' | 'pending' = 'pending';
          let value = '';
          if (a?.state === 'answered') {
            status = 'answered';
            value = String(a.value) + (s.unit === 'mm' ? ' mm' : '');
          } else if (a?.state === 'skipped') {
            status = 'skipped';
            value = 'skipped';
          } else if (s.key === SCOPE_STEP_KEY && i < state.stepIndex) {
            status = 'answered';
            value = `${state.query.scope.phases.length} phases`;
          }
          const clickable = i <= furthest;
          return (
            <li
              key={String(s.key) + i}
              className={`rail-row rail-${status}${isCurrent ? ' is-current' : ''}`}
            >
              <button
                className="rail-btn"
                disabled={!clickable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => dispatch({ type: 'GOTO_STEP', index: i })}
              >
                <span className="rail-node" aria-hidden="true">
                  {status === 'answered' ? '✓' : status === 'skipped' ? '–' : ''}
                </span>
                <span className="rail-text">
                  <span className="rail-prompt">{SHORT[s.key as string] ?? s.prompt}</span>
                  {value ? <span className="rail-value">{value}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {steps.length === 1 ? (
        <p className="rail-hint">
          Pick a fastener type and the remaining steps appear here. Every step can
          be skipped.
        </p>
      ) : null}
    </aside>
  );
}
