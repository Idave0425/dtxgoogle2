import { useAppState, useDispatch } from '../../state/context';
import { selectSteps } from '../../state/selectors';
import { labelFor } from '../../engine/match';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';

export function QueryRecap() {
  const state = useAppState();
  const dispatch = useDispatch();
  const allSteps = selectSteps(state);
  const steps = allSteps.filter((s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY);
  const scope = state.query.scope;

  const answered = steps.filter((s) => state.query.answers[s.key]?.state === 'answered');
  const skipped = steps.filter((s) => state.query.answers[s.key]?.state === 'skipped');

  const results = state.results ?? [];
  const n = (v: string) => results.filter((r) => r.verdict === v).length;

  function edit(key: string) {
    dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' });
    const idx = allSteps.findIndex((x) => x.key === key);
    if (idx >= 0) dispatch({ type: 'GOTO_STEP', index: idx });
  }

  return (
    <section className="recap card" aria-label="Your search">
      <div className="recap-top">
        <div className="stats">
          <div className="stat stat-match"><strong>{n('match')}</strong><span>match</span></div>
          <div className="stat stat-near"><strong>{n('near')}</strong><span>close</span></div>
          <div className="stat stat-review"><strong>{n('review')}</strong><span>needs review</span></div>
          <div className="stat stat-different"><strong>{n('different')}</strong><span>excluded</span></div>
        </div>
        <div className="recap-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' })}>
            Edit search
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'RESET' })}>
            New search
          </button>
        </div>
      </div>

      <div className="recap-chips">
        {answered.map((s) => {
          const a = state.query.answers[s.key]!;
          return (
            <button key={s.key as string} className="recap-chip" title="Change" onClick={() => edit(s.key)}>
              <span className="recap-k">{labelFor(s.key)}</span>
              {String(a.value)}
              {s.unit === 'mm' ? ' mm' : ''}
            </button>
          );
        })}
        {skipped.map((s) => (
          <button key={s.key as string} className="recap-chip is-skipped" title="Answer" onClick={() => edit(s.key)}>
            <span className="recap-k">{labelFor(s.key)}</span>
            skipped
          </button>
        ))}
        <span className="recap-chip is-scope">
          <span className="recap-k">scope</span>
          {scope.phases.join(', ')}
          {scope.allowKits ? ' · kits' : ''}
          {scope.strict ? ' · strict' : ''}
        </span>
      </div>
    </section>
  );
}
