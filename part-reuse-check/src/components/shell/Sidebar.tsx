// Open-plane shell: the sidebar sits on the page ground. It names the product
// and its scope, holds the nav, and nests the search steps under "Search".

import { useAppState, useDispatch } from '../../state/context';
import { selectFurthestReachable, selectSteps } from '../../state/selectors';
import { labelFor } from '../../engine/match';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import type { Screen } from '../../types';
import { Icon, IconName } from '../common/Icon';
import { ProductMark } from './ProductMark';

export function Sidebar() {
  const state = useAppState();
  const dispatch = useDispatch();
  const steps = selectSteps(state);
  const furthest = selectFurthestReachable(state);
  const nResults = state.results?.filter((r) => r.verdict !== 'different').length;
  const current = state.screen === 'deadEnd' ? 'results' : state.screen;

  const nav: { screen: Screen; label: string; icon: IconName; count?: string; disabled?: boolean }[] = [
    { screen: 'wizard', label: 'Search', icon: 'search' },
    {
      screen: 'results',
      label: 'Results',
      icon: 'list',
      count: nResults !== undefined ? String(nResults) : undefined,
      disabled: !state.results,
    },
    {
      screen: 'compare',
      label: 'Compare',
      icon: 'columns',
      count:
        state.compareGpns.length && (nResults ?? 0) >= 2
          ? `${state.compareGpns.length} of 2`
          : undefined,
      disabled: state.compareGpns.length !== 2,
    },
    {
      screen: 'flags',
      label: 'Flagged clusters',
      icon: 'flag',
      count: state.flags.length ? String(state.flags.length) : undefined,
    },
  ];

  function open(screen: Screen) {
    dispatch({
      type: 'OPEN_SCREEN',
      screen: screen === 'results' && state.screen === 'deadEnd' ? 'deadEnd' : screen,
    });
  }

  function goToStep(i: number) {
    dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' });
    dispatch({ type: 'GOTO_STEP', index: i });
  }

  return (
    <aside className="sidebar">
      <button className="product" onClick={() => dispatch({ type: 'RESET' })} title="Start a new search">
        <ProductMark />
        <span className="product-text">
          <strong>Part Reuse Check</strong>
        </span>
      </button>

      <nav className="nav" aria-label="Screens">
        {nav.map((n) => (
          <div key={n.screen}>
            <button
              className={`nav-item${current === n.screen ? ' is-active' : ''}`}
              aria-current={current === n.screen ? 'page' : undefined}
              disabled={n.disabled}
              onClick={() => open(n.screen)}
            >
              <Icon name={n.icon} />
              <span className="nav-label">{n.label}</span>
              {n.count ? <span className="nav-count num">{n.count}</span> : null}
            </button>

            {n.screen === 'wizard' && steps.length > 1 ? (
              <ol className="steps" aria-label="Search steps">
                {steps.map((s, i) => {
                  const a = state.query.answers[s.key];
                  const isScope = s.key === SCOPE_STEP_KEY;
                  const isReview = s.key === REVIEW_STEP_KEY;
                  const value =
                    a?.state === 'answered'
                      ? String(a.value) + (s.unit === 'mm' ? ' mm' : '')
                      : a?.state === 'skipped'
                      ? 'skipped'
                      : isScope && i < furthest
                      ? `${state.query.scope.phases.length} phases`
                      : '';
                  const isCurrent = state.screen === 'wizard' && i === state.stepIndex;
                  const label = isScope ? 'Scope' : isReview ? 'Review' : labelFor(s.key);
                  return (
                    <li key={String(s.key)}>
                      <button
                        className={`step-item${isCurrent ? ' is-current' : ''}${
                          a?.state === 'skipped' ? ' is-skipped' : ''
                        }`}
                        disabled={i > furthest}
                        aria-current={isCurrent ? 'step' : undefined}
                        onClick={() => goToStep(i)}
                      >
                        <span className="step-label">{label}</span>
                        <span className="step-value">{value}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            ) : null}
          </div>
        ))}
      </nav>

    </aside>
  );
}
