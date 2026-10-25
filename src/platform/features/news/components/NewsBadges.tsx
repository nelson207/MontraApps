import { categoryIcon, STATUS_LABELS, type NewsStatus } from "../newsModel";

export function NewsCategoryBadge({ category, onImage = false }: { category: string; onImage?: boolean }) {
  return (
    <span
      className={`badge rounded-pill text-truncate app-news-badge ${onImage ? "text-bg-light" : "bg-primary-subtle text-primary-emphasis"}`}
      title={category}
    >
      <i className={`bi ${categoryIcon(category)} me-1`} aria-hidden="true" />
      {category}
    </span>
  );
}

const STATUS_STYLE = {
  active: { className: "bg-success-subtle text-success-emphasis", icon: "bi-check-circle" },
  scheduled: { className: "bg-info-subtle text-info-emphasis", icon: "bi-clock" },
  expired: { className: "bg-secondary-subtle text-secondary-emphasis", icon: "bi-archive" },
} as const;

/** Active / Scheduled / Expired, from the news' validity dates (statusOf) */
export function NewsStatusBadge({ status }: { status: NewsStatus }) {
  const { className, icon } = STATUS_STYLE[status];
  return (
    <span className={`badge rounded-pill ${className}`}>
      <i className={`bi ${icon} me-1`} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
