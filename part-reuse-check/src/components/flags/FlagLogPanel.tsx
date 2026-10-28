import { useAppState, useDispatch } from '../../state/context';
import { selectAllClusters } from '../../state/selectors';
import { TitleRow } from '../shell/TitleRow';

export function FlagLogPanel() {
  const state = useAppState();
  const dispatch = useDispatch();
  const clusters = selectAllClusters();
  const byId = new Map(clusters.map((c) => [c.id, c]));

  return (
    <>
      <TitleRow
        title="Flagged clusters"
        sub={
          state.flags.length
            ? `${state.flags.length} cluster${state.flags.length === 1 ? '' : 's'} flagged for the data owner this session.`
            : 'Nothing flagged yet. Flag a duplicate notice from a result to collect it here.'
        }
        source="In-memory only: flagging sends nothing anywhere and clears when the tab closes."
        actions={
          <button
            className="btn btn-secondary"
            onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: state.results ? 'results' : 'wizard' })}
          >
            Back
          </button>
        }
      />
      {state.flags.length ? (
        <section className="panel">
          <table className="plain-table">
            <thead>
              <tr>
                <th>Cluster</th>
                <th>GPNs</th>
                <th className="num">Flagged</th>
              </tr>
            </thead>
            <tbody>
              {state.flags.map((f) => {
                const c = byId.get(f.clusterId);
                return (
                  <tr key={f.clusterId}>
                    <td className="mono">{f.clusterId}</td>
                    <td className="mono">{c ? c.gpns.join(', ') : '—'}</td>
                    <td className="num">{f.at.slice(11, 16)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
