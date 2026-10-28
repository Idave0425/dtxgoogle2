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
      <div className="step-title-line">
        <h2 className="step-prompt">{title}</h2>
        {total ? (
          <span className="step-count num">
            {index + 1} of {total}
          </span>
        ) : null}
      </div>
      {help ? <p className="step-help">{help}</p> : null}
    </header>
  );
}
