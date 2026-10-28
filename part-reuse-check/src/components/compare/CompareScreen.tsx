import { useAppState, useDispatch } from '../../state/context';
import { selectPartByGpn, selectSteps, selectVolume } from '../../state/selectors';
import { CompareRow } from './CompareRow';
import { REVIEW_STEP_KEY, SCOPE_STEP_KEY } from '../../engine/steps';
import { formatQty, TIER_LABEL } from '../../engine/volume';
import { VerdictBadge } from '../common/VerdictBadge';
import type { PartRecord } from '../../types';
import { TitleRow } from '../shell/TitleRow';

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
      <TitleRow
        title="Compare"
        sub="Tick two rows on the results screen to compare them here."
        actions={<button className="btn btn-secondary" onClick={back}>Back to results</button>}
      />
    );
  }

  const diffCount = steps.filter(
    (s) => (a.attributes as any)[s.key] !== (b.attributes as any)[s.key]
  ).length;
  const verdictOf = (gpn: string) => state.results?.find((r) => r.part.gpn === gpn)?.verdict;

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
    <>
      <TitleRow
        title={
          <>
            <span className="mono">{a.gpn}</span> and <span className="mono">{b.gpn}</span>
          </>
        }
        sub={`They differ on ${diffCount} of ${steps.length} attributes. A dot marks each difference.`}
        actions={<button className="btn btn-secondary" onClick={back}>Back to results</button>}
      />

      <div className="table-wrap panel">
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
    </>
  );
}
