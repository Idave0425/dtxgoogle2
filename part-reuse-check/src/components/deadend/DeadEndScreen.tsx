import { useAppState, useDispatch } from '../../state/context';
import { selectQuerySummary, selectVolume } from '../../state/selectors';
import { formatQty } from '../../engine/volume';
import { NewGpnRequest } from './NewGpnRequest';
import { TitleRow } from '../shell/TitleRow';

export function DeadEndScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const misses = (state.results ?? []).filter((r) => r.verdict === 'different').slice(0, 8);
  const first = misses[0];

  return (
    <>
      <TitleRow
        title={<span className="query-title">{selectQuerySummary(state)}</span>}
        sub={
          first ? (
            <>
              No existing GPN fits. The nearest, <strong className="mono">{first.part.gpn}</strong>,
              differs only on {first.exclusionReason}.
            </>
          ) : (
            'No existing GPN fits, and nothing came close.'
          )
        }
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => dispatch({ type: 'OPEN_SCREEN', screen: 'wizard' })}>
              Change search
            </button>
            <button className="btn btn-secondary" onClick={() => dispatch({ type: 'RESET' })}>
              New search
            </button>
          </>
        }
      />

      <div className="dead-grid">
        <section className="panel" aria-label="Nearest misses">
          <header className="panel-head">
            <h2>Nearest misses</h2>
            <span className="muted">check these before requesting a new GPN</span>
          </header>
          {misses.length === 0 ? (
            <p className="empty-line">No part in scope shares enough of your answers to be close.</p>
          ) : (
            <table className="plain-table">
              <thead>
                <tr>
                  <th>GPN</th>
                  <th>Why it doesn't fit</th>
                  <th className="num">Volume, pcs / yr</th>
                </tr>
              </thead>
              <tbody>
                {misses.map((r) => {
                  const v = selectVolume(r.part.gpn).record;
                  return (
                    <tr key={r.part.gpn}>
                      <td>
                        <span className="mono strong">{r.part.gpn}</span>
                        <span className="cell-sub">{r.part.description}</span>
                      </td>
                      <td className="reason">{r.exclusionReason}</td>
                      <td className="num">{v ? formatQty(v.annualQty) : <span className="muted">pending</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
        <NewGpnRequest />
      </div>
    </>
  );
}
