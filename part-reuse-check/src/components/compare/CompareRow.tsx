import type { Answer, PartRecord, StepDefinition } from '../../types';
import { compareAttribute, labelFor } from '../../engine/match';

const MARK = { match: '✓', near: '≈', differs: '✕', unknown: '?', 'not-asked': '·' } as const;

export function CompareRow({
  step,
  answer,
  a,
  b,
}: {
  step: StepDefinition;
  answer: Answer | undefined;
  a: PartRecord | undefined;
  b: PartRecord | undefined;
}) {
  const asked = answer?.state === 'answered';
  const differs =
    !!a &&
    !!b &&
    (a.attributes as any)[step.key] !== (b.attributes as any)[step.key];

  function cell(part: PartRecord | undefined) {
    if (!part) return <span className="cmp-cell rt-unknown">—</span>;
    const found = (part.attributes as any)[step.key] as string | number | null;
    const cmp = compareAttribute(step.key, answer, found);
    const show =
      found === null ? "doesn't say" : String(found) + (step.unit === 'mm' ? ' mm' : '');
    return (
      <span className={`cmp-cell rt-${cmp.verdict}`}>
        <span className="rt-mark" aria-hidden="true">{MARK[cmp.verdict]}</span>
        {show}
      </span>
    );
  }

  return (
    <tr className={`cmp-row${asked ? '' : ' is-skipped'}${differs ? ' is-diff' : ''}`}>
      <th scope="row">
        {labelFor(step.key)}
        {differs ? <span className="diff-dot" title="The two parts differ here" /> : null}
      </th>
      <td className="cmp-asked">
        {asked ? String(answer!.value) + (step.unit === 'mm' ? ' mm' : '') : 'not asked'}
      </td>
      <td>{cell(a)}</td>
      <td>{cell(b)}</td>
    </tr>
  );
}
