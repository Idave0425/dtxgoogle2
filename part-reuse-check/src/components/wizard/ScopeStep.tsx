import { useAppState, useDispatch } from '../../state/context';
import type { LifecyclePhase } from '../../types';
import { selectPoolCounts, selectSteps } from '../../state/selectors';
import { StepHeader } from './StepHeader';
import { PoolMeter } from './PoolMeter';

const PHASE_GROUPS: { title: string; note: string; phases: LifecyclePhase[] }[] = [
  {
    title: 'Active',
    note: 'Safe to design in',
    phases: ['Production', 'Preliminary', 'Planning'],
  },
  { title: 'Early', note: 'Not yet released', phases: ['Prototype'] },
  {
    title: 'Retired',
    note: 'Usually avoid',
    phases: ['End of Production', 'Sunset', 'Obsolete'],
  },
];

export function ScopeStep() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const scope = state.query.scope;
  const counts = selectPoolCounts(state);

  function toggle(p: LifecyclePhase) {
    const has = scope.phases.includes(p);
    dispatch({
      type: 'SET_SCOPE',
      scope: {
        phases: has ? scope.phases.filter((x) => x !== p) : [...scope.phases, p],
      },
    });
  }

  return (
    <section className="panel step">
      <StepHeader
        index={state.stepIndex}
        total={steps.length}
        title="Which parts should we search?"
        help='Defaults fit the common "designing something new" case: active parts only, no kits.'
      />

      <div className="scope-groups">
        {PHASE_GROUPS.map((g) => (
          <fieldset key={g.title} className="scope-group">
            <legend>
              {g.title} <span>· {g.note}</span>
            </legend>
            <div className="chip-row">
              {g.phases.map((p) => {
                const on = scope.phases.includes(p);
                return (
                  <label key={p} className={`toggle-chip${on ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(p)} />
                    {p}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="scope-switches">
        <label className="switch-row">
          <input
            type="checkbox"
            checked={scope.allowKits}
            onChange={() =>
              dispatch({ type: 'SET_SCOPE', scope: { allowKits: !scope.allowKits } })
            }
          />
          <span className="switch" aria-hidden="true" />
          <span>
            <strong>Include kits</strong>
            <small>Fasteners bundled with brackets or other hardware.</small>
          </span>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={scope.strict}
            onChange={() =>
              dispatch({ type: 'SET_SCOPE', scope: { strict: !scope.strict } })
            }
          />
          <span className="switch" aria-hidden="true" />
          <span>
            <strong>Strict mode</strong>
            <small>
              Hide parts that don't state something you asked for. Shorter list,
              but it hides exactly the poorly-described duplicates this tool
              exists to find.
            </small>
          </span>
        </label>
      </div>

      <footer className="step-footer">
        <PoolMeter exact={counts.exact} near={counts.near} unknown={counts.unknown} />
        <div className="step-controls">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'BACK' })}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'GOTO_STEP', index: steps.length - 1 })}
          >
            Continue
          </button>
        </div>
      </footer>
    </section>
  );
}
