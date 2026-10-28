import { OptionCombobox } from '../common/OptionCombobox';
import { useAppState, useDispatch } from '../../state/context';
import {
  selectCurrentStep,
  selectFurthestReachable,
  selectOptionsForCurrentStep,
  selectPoolCounts,
  selectSteps,
} from '../../state/selectors';
import { PoolMeter } from './PoolMeter';
import { StepHeader } from './StepHeader';

export function AttributeStep() {
  const state = useAppState();
  const dispatch = useDispatch();
  const step = selectCurrentStep(state);
  const options = selectOptionsForCurrentStep(state);
  const counts = selectPoolCounts(state);
  const steps = selectSteps(state);
  const isFamily = step.key === 'family';
  // Editing one answer from the results screen shouldn't force a re-walk.
  const canJumpToReview =
    !isFamily && selectFurthestReachable(state) === steps.length - 1;

  const answer = state.query.answers[step.key];
  const current =
    answer?.state === 'answered' ? (answer.value as string | number) : null;

  return (
    <section className="panel step">
      <StepHeader
        index={state.stepIndex}
        total={isFamily ? null : steps.length}
        title={step.prompt}
        help={step.help}
      />

      <OptionCombobox
        options={options}
        value={current}
        customUnit={step.kind === 'numeric' ? step.unit : undefined}
        customHint={
          step.nearTolerance
            ? 'parts within ~3% show as close matches'
            : 'exact value only, close values are not matched'
        }
        onSelect={(v) =>
          dispatch({
            type: 'ANSWER',
            key: step.key,
            value: step.kind === 'numeric' ? Number(v) : v,
          })
        }
        placeholder={
          step.kind === 'numeric'
            ? 'Pick a size, or type one like 5.4'
            : isFamily
            ? 'Search screw, washer, nut…'
            : 'Type to filter…'
        }
      />

      <footer className="step-footer">
        {isFamily ? (
          <p className="step-foot-note">
            {counts.total} fasteners in scope. Counts on the right show how many
            parts state each value.
          </p>
        ) : (
          <PoolMeter exact={counts.exact} near={counts.near} unknown={counts.unknown} />
        )}
        <div className="step-controls">
          {state.stepIndex > 0 ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => dispatch({ type: 'BACK' })}
            >
              Back
            </button>
          ) : null}
          {!isFamily ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dispatch({ type: 'SKIP', key: step.key })}
              title="Skipping applies no filter. It is never treated as a match."
            >
              Skip this step
            </button>
          ) : null}
          {canJumpToReview ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => dispatch({ type: 'GOTO_STEP', index: steps.length - 1 })}
            >
              Go to review
            </button>
          ) : null}
        </div>
      </footer>
    </section>
  );
}
