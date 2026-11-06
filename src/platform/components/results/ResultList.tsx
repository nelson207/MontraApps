import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Tone } from "./resultsModel";

export function ResultList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul className="list-unstyled app-results-list mb-0" aria-label={label}>
      {children}
    </ul>
  );
}

type RowProps = {
  accent?: Tone;
  /** What the accent means (read by screen readers, tooltip on the bar) */
  accentLabel?: string;
  leading?: ReactNode;
  title: ReactNode;
  /** Second line under the title (e-mail, subtitle…) */
  secondary?: ReactNode;
  /** Columns from md up, wrapped under the title on small screens */
  meta?: ReactNode[];
  trailing?: ReactNode;
  /**
   * A button of its own beside the row (outside its link). Pass null on the rows without one, so
   * every row of the list keeps the same column for it.
   */
  action?: ReactNode;
} & (
  | { to: string; /** Router state for the page opened */ state?: unknown; onClick?: never; dialog?: never }
  | { onClick: () => void; to?: never; /** Opens a popup */ dialog?: boolean }
  /** Nothing to open: shown only */
  | { to?: never; onClick?: never; dialog?: never }
);

// One compact result: the whole row opens it (a router link or a button), or shows it only.
export function ResultRow({ accent, accentLabel, leading, title, secondary, meta = [], trailing, action: rowAction, ...action }: RowProps) {
  const content = (
    <>
      <span className={`app-results-accent ${accent ? `tone-${accent}` : ""}`} title={accentLabel} aria-hidden="true" />
      {accentLabel && <span className="visually-hidden">{accentLabel}: </span>}
      {leading && <span className="app-results-leading">{leading}</span>}
      <span className="app-results-main">
        <span className="app-results-row-title">{title}</span>
        {secondary && <span className="app-results-secondary">{secondary}</span>}
      </span>
      {meta.length > 0 && (
        <span className="app-results-meta">
          {meta.map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </span>
      )}
      <span className="app-results-trailing">{trailing}</span>
      {(action.to !== undefined || action.onClick) && <i className="bi bi-chevron-right app-results-chevron" aria-hidden="true" />}
    </>
  );

  const hasActionColumn = rowAction !== undefined;
  return (
    <li className={hasActionColumn ? "app-results-item" : undefined}>
      {action.to !== undefined ? (
        <Link to={action.to} state={action.state} className="app-results-row">
          {content}
        </Link>
      ) : !action.onClick ? (
        <div className="app-results-row is-static">{content}</div>
      ) : (
        <button type="button" className="app-results-row" aria-haspopup={action.dialog ? "dialog" : undefined} onClick={action.onClick}>
          {content}
        </button>
      )}
      {hasActionColumn && <span className="app-results-action">{rowAction}</span>}
    </li>
  );
}
