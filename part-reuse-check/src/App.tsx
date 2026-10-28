import { useAppState, useDispatch } from './state/context';
import { PrototypeBanner } from './components/common/PrototypeBanner';
import { WizardScreen } from './components/wizard/WizardScreen';
import { ResultsScreen } from './components/results/ResultsScreen';
import { CompareScreen } from './components/compare/CompareScreen';
import { DeadEndScreen } from './components/deadend/DeadEndScreen';
import { FlagLogPanel } from './components/flags/FlagLogPanel';
import type { Screen } from './types';

export default function App() {
  const state = useAppState();
  const dispatch = useDispatch();
  const open = (screen: Screen) => dispatch({ type: 'OPEN_SCREEN', screen });
  const nResults = state.results?.filter((r) => r.verdict !== 'different').length ?? 0;

  const tabs: { screen: Screen; label: string; count?: number; disabled?: boolean }[] = [
    { screen: 'wizard', label: 'Search' },
    { screen: 'results', label: 'Results', count: state.results ? nResults : undefined, disabled: !state.results },
    { screen: 'compare', label: 'Compare', count: state.compareGpns.length || undefined, disabled: state.compareGpns.length !== 2 },
    { screen: 'flags', label: 'Flags', count: state.flags.length || undefined },
  ];
  const current = state.screen === 'deadEnd' ? 'results' : state.screen;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button className="brand" onClick={() => dispatch({ type: 'RESET' })} title="New search">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="brand-text">
              <strong>Part Reuse Check</strong>
              <span>Find an existing GPN before you create a new one</span>
            </span>
          </button>
          <nav className="tabs" aria-label="Screens">
            {tabs.map((t) => (
              <button
                key={t.screen}
                className={`tab${current === t.screen ? ' is-current' : ''}`}
                aria-current={current === t.screen ? 'page' : undefined}
                disabled={t.disabled}
                onClick={() => open(state.screen === 'deadEnd' && t.screen === 'results' ? 'deadEnd' : t.screen)}
              >
                {t.label}
                {t.count !== undefined ? <span className="tab-count">{t.count}</span> : null}
              </button>
            ))}
          </nav>
          <PrototypeBanner />
        </div>
      </header>

      <main className={`main main-${state.screen}`}>
        {state.screen === 'wizard' && <WizardScreen />}
        {state.screen === 'results' && <ResultsScreen />}
        {state.screen === 'compare' && <CompareScreen />}
        {state.screen === 'deadEnd' && <DeadEndScreen />}
        {state.screen === 'flags' && <FlagLogPanel />}
      </main>

      <footer className="footer">
        Runs off a static data file · no backend · nothing leaves this browser tab
      </footer>
    </div>
  );
}
