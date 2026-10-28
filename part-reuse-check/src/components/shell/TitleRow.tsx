import type { ReactNode } from 'react';

/** One h1 per screen, a one-line finding under it, real actions on the right. */
export function TitleRow({
  title,
  sub,
  source,
  actions,
}: {
  title: ReactNode;
  sub?: ReactNode;
  source?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="title-row">
      <div className="title-text">
        <h1>{title}</h1>
        {sub ? <p className="title-sub">{sub}</p> : null}
        {source ? <p className="title-source">{source}</p> : null}
      </div>
      {actions ? <div className="title-actions">{actions}</div> : null}
    </header>
  );
}
