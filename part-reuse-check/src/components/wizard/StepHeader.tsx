export function StepHeader({
  index,
  total,
  title,
  help,
}: {
  index: number;
  /** null before the family is chosen: the step count isn't known yet. */
  total: number | null;
  title: string;
  help: string;
}) {
  return (
    <header className="step-header">
      <div className="step-progress" aria-hidden="true">
        <span style={{ width: `${total ? ((index + 1) / total) * 100 : 4}%` }} />
      </div>
      <div className="step-eyebrow">
        {total ? `Step ${index + 1} of ${total}` : 'Start here'}
      </div>
      <h2 className="step-prompt">{title}</h2>
      {help ? <p className="step-help">{help}</p> : null}
    </header>
  );
}
