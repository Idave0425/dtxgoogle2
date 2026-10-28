import { useAppState, useDispatch } from '../../state/context';
import { selectPartByGpn, selectSteps, selectVolume } from '../../state/selectors';
import { CompareRow } from './CompareRow';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import { formatQty, TIER_LABEL } from '../../engine/volume';
import { VerdictBadge } from '../common/VerdictBadge';
import type { PartRecord } from '../../types';

export function CompareScreen() {
  const state = useAppState();
  const dispatch = useDispatch();
  const [gpnA, gpnB] = state.compareGpns;
  const a = gpnA ? selectPartByGpn(gpnA) : undefined;
  const b = gpnB ? selectPartByGpn(gpnB) : undefined;
  const steps = selectSteps(state).filter(
    (s) => s.key !== SCOPE_STEP_KEY && s.key !== REVIEW_STEP_KEY && s.key !== 'family'
  );
  const back = () => dispatch({ type: 'OPEN_SCREEN', screen: 'results' });

  if (!a || !b) {
    return (
      <div className="empty-state card">
        <h2>Pick two parts to compare</h2>
        <p className="muted">Tick two rows on the Results screen, then come back here.</p>
        <button className="btn btn-primary" onClick={back}>Back to results</button>
      </div>
    );
  }

  const verdictOf = (gpn: string) => state.results?.find((r) => r.part.gpn === gpn)?.verdict;
  const unknowns = (p: PartRecord) =>
    steps.filter((s) => (p.attributes as any)[s.key] === null).length;

  function volumeText(p: PartRecord) {
    const v = selectVolume(p.gpn);
    return v.record ? `${formatQty(v.record.annualQty)} / yr · ${TIER_LABEL[v.tier]}` : 'pending';
  }

  function head(p: PartRecord) {
    const v = verdictOf(p.gpn);
    return (
      <th scope="col" className="cmp-part">
        <div className="mono cmp-gpn">{p.gpn}</div>
        {v ? <VerdictBadge verdict={v} /> : null}
        <div className="cmp-desc">“{p.description}”</div>
      </th>
    );
  }

  return (
    <div className="compare">
      <header className="screen-head">
        <div>
          <h2>Side-by-side</h2>
          <p className="muted">Dots mark rows where the two parts differ.</p>
        </div>
        <button className="btn btn-ghost" onClick={back}>Back to results</button>
      </header>

      <div className="table-wrap card">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Attribute</th>
              <th scope="col">You asked</th>
              {head(a)}
              {head(b)}
            </tr>
          </thead>
          <tbody>
            <tr className="cmp-row cmp-meta">
              <th scope="row">Lifecycle</th>
              <td className="cmp-asked">{state.query.scope.phases.length} phases</td>
              <td>{a.phase}</td>
              <td>{b.phase}</td>
            </tr>
            <tr className="cmp-row cmp-meta">
              <th scope="row">Volume</th>
              <td className="cmp-asked">—</td>
              <td>{volumeText(a)}</td>
              <td>{volumeText(b)}</td>
            </tr>
            {steps.map((s) => (
              <CompareRow
                key={s.key as string}
                step={s}
                answer={state.query.answers[s.key]}
                a={a}
                b={b}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ul className="compare-conclusions">
        {[a, b].map((p) => {
          const n = unknowns(p);
          return (
            <li key={p.gpn} className="card">
              <span className="mono">{p.gpn}</span>
              {n > 0
                ? ` — ${n} unknown${n === 1 ? '' : 's'}. Needs a manufacturer catalogue page or engineering sign-off to clear.`
                : ' — fully specified for this family.'}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
