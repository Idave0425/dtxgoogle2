import { useAppState } from '../../state/context';
import { selectCurrentStep } from '../../state/selectors';
import { AttributeStep } from './AttributeStep';
import { ReviewStep } from './ReviewStep';
import { ScopeStep } from './ScopeStep';
import { Shortlist } from './Shortlist';
import { TitleRow } from '../shell/TitleRow';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';

// Grid: step card (1fr) + 360px shortlist, one 12px gap.
export function WizardScreen() {
  const state = useAppState();
  const step = selectCurrentStep(state);
  return (
    <>
      <TitleRow
        title="Find a fastener"
      />
      <div className="wizard">
        <div className="wizard-main">
          {step.key === SCOPE_STEP_KEY ? (
            <ScopeStep />
          ) : step.key === REVIEW_STEP_KEY ? (
            <ReviewStep />
          ) : (
            <AttributeStep />
          )}
        </div>
        <Shortlist />
      </div>
    </>
  );
}
