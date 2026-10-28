import { useMemo, useState } from 'react';
import { useAppState, useDispatch } from '../../state/context';
import {
  selectClustersForVisibleResults,
  selectExcluded,
  selectMaxVolume,
  selectPreferredGpn,
  selectSteps,
} from '../../state/selectors';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import { ExcludedSummary } from './ExcludedSummary';
import { QueryRecap } from './QueryRecap';
import { ResultsLegend } from './ResultsLegend';
import { ResultsTable } from './ResultsTable';
import { PreferredCallout } from './PreferredCallout';
import { VolumeSourceNote } from '../volume/VolumeCell';

export function ResultsScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const all = state.results ?? [];
  const visible = all.filter((r) => r.verdict !== 'different');
  const excluded = selectExcluded(state);
  const preferred = selectPreferredGpn(state);
  const maxVolume = selectMaxVolume(visible.map((r) => r.part.gpn));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const clusters = selectClustersForVisibleResults(state);
  const clustersByGpn = useMemo(() => {
    const m = new Map<string, typeof clusters>();
    for (const c of clusters) {
      for (const g of c.gpns) {
        if (!m.has(g)) m.set(g, []);
        m.get(g)!.push(c);
      }
    }
    return m;
  }, [clusters]);

  // Columns: every attribute the engineer answered or skipped, minus family.
  const steps = selectSteps(state).filter(
    (s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY && s.key !== 'family'
  );
  const touched = steps.filter((s) => !!state.query.answers[s.key]);
  const columns = touched.length ? touched : steps;

  function toggle(gpn: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(gpn)) n.delete(gpn);
      else n.add(gpn);
      return n;
    });
  }

  function reveal(gpn: string) {
    setExpanded((prev) => new Set(prev).add(gpn));
    requestAnimationFrame(() =>
      document
        .getElementById(`row-${gpn}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    );
  }

  return (
    <div className="results">
      <QueryRecap />
      <PreferredCallout onReveal={reveal} />
      <VolumeSourceNote />

      <div className="results-toolbar">
        <div className="sort-note">
          Sorted by <strong>match</strong> → <strong>lifecycle</strong> →{' '}
          <strong>volume</strong>
        </div>
        <ResultsLegend />
        <button
          className="btn btn-primary btn-sm"
          disabled={state.compareGpns.length !== 2}
          onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'compare' })}
          title={
            state.compareGpns.length !== 2
              ? 'Tick two GPNs to compare them side by side'
              : 'Compare the two selected GPNs'
          }
        >
          Compare {state.compareGpns.length}/2
        </button>
      </div>

      <ResultsTable
        rows={visible}
        columns={columns}
        clustersByGpn={clustersByGpn}
        preferred={preferred}
        maxVolume={maxVolume}
        expanded={expanded}
        onToggle={toggle}
      />

      <ExcludedSummary excluded={excluded} />
    </div>
  );
}
