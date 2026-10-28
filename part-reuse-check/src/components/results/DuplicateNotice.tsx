import type { DuplicateCluster } from '../../types';
import { useAppState, useDispatch } from '../../state/context';
import { labelFor } from '../../engine/match';
import { combinedVolume, formatQty } from '../../engine/volume';
import { selectPartByGpn, selectVolume, selectVolumes } from '../../state/selectors';
import { clusterLabel } from './clusterLabel';

export function DuplicateNotice({
  cluster,
  currentGpn,
}: {
  cluster: DuplicateCluster;
  currentGpn?: string;
}) {
  const state = useAppState();
  const dispatch = useDispatch();
  const members = cluster.gpns
    .map((g) => selectPartByGpn(g))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const label = clusterLabel(cluster, members);
  const flagged = state.flags.some((f) => f.clusterId === cluster.id);
  const combined = combinedVolume(selectVolumes(), cluster);

  return (
    <aside className={`cluster cluster-${label.kind}`} role="note">
      <header className="cluster-head">
        <span className={`tag tag-${label.kind}`}>{label.short}</span>
        <strong>{label.title}</strong>
      </header>
      <p className="cluster-guidance">{label.guidance}</p>

      <table className="cluster-members">
        <tbody>
          {cluster.gpns.map((g) => {
            const p = members.find((m) => m.gpn === g);
            const v = selectVolume(g).record;
            return (
              <tr key={g} className={g === currentGpn ? 'is-current' : ''}>
                <td className="mono">{g}</td>
                <td>{p?.phase ?? 'outside fastener scope'}</td>
                <td>
                  {p?.packaging.quantity ? `${p.packaging.quantity}-pack` : 'single'}
                </td>
                <td className="num">
                  {v ? `${formatQty(v.annualQty)} / yr` : <span className="muted">pending</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
        {cluster.evidence === 'pack-variant' ? (
          <tfoot>
            <tr>
              <td colSpan={3}>Combined volume</td>
              <td className="num">
                {combined !== null ? `${formatQty(combined)} / yr` : 'pending'}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>

      {cluster.evidence === 'shared-mpn' ? (
        <p className="cluster-evidence">
          Shared MPN <code>{cluster.evidenceValue}</code>
        </p>
      ) : null}
      {cluster.conflictingKeys.length > 0 ? (
        <p className="cluster-evidence">
          Conflict on{' '}
          {cluster.conflictingKeys.map((k) => (
            <span key={k} className="chip chip-differs">
              {labelFor(k)}
            </span>
          ))}
        </p>
      ) : null}

      <div className="cluster-actions">
        <button
          className="btn btn-secondary btn-sm"
          disabled={flagged}
          onClick={() => dispatch({ type: 'FLAG_CLUSTER', clusterId: cluster.id })}
        >
          {flagged ? 'Flagged' : 'Flag to data owner'}
        </button>
        <span className="muted small">In-memory only. Nothing leaves this tab.</span>
      </div>
    </aside>
  );
}
