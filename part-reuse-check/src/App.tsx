import { useAppState } from './state/context';
import { Sidebar } from './components/shell/Sidebar';
import { WizardScreen } from './components/wizard/WizardScreen';
import { ResultsScreen } from './components/results/ResultsScreen';
import { CompareScreen } from './components/compare/CompareScreen';
import { DeadEndScreen } from './components/deadend/DeadEndScreen';
import { FlagLogPanel } from './components/flags/FlagLogPanel';

// Grid: 248px sidebar + fluid canvas with a 32px gutter on both sides.
export default function App() {
  const state = useAppState();
  return (
    <div className="shell">
      <Sidebar />
      <main className={`canvas canvas-${state.screen}`}>
        {state.screen === 'wizard' && <WizardScreen />}
        {state.screen === 'results' && <ResultsScreen />}
        {state.screen === 'compare' && <CompareScreen />}
        {state.screen === 'deadEnd' && <DeadEndScreen />}
        {state.screen === 'flags' && <FlagLogPanel />}
      </main>
    </div>
  );
}
