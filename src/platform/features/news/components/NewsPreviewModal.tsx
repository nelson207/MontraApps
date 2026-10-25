import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { excerpt, formatNewsDate, type NewsItem } from "../newsModel";
import { NewsCategoryBadge, NewsStatusBadge } from "./NewsBadges";
import NewsImage from "./NewsImage";

type Props = {
  items: NewsItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const PREVIEW_LENGTH = 420;

// Quick look at a news item from the gallery, with ←/→ to browse the others.
// Bootstrap modal markup, controlled by React: Esc / backdrop close, page scroll locked,
// focus moved into the dialog and back to where it was on close.
function NewsPreviewModal({ items, index, onIndexChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const item = items[index];
  const hasPrevious = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
      previouslyFocused?.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrevious) onIndexChange(index - 1);
      if (e.key === "ArrowRight" && hasNext) onIndexChange(index + 1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [index, hasPrevious, hasNext, onClose, onIndexChange]);

  if (!item) return null;
  const titleId = `news-preview-title-${item.id}`;

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div ref={dialogRef} className="modal-content border-0 shadow-lg overflow-hidden" tabIndex={-1}>
            <div className="position-relative app-news-preview-hero">
              <NewsImage item={item} />
              <div className="position-absolute top-0 start-0 m-3 d-flex gap-2">
                <NewsCategoryBadge category={item.category} onImage />
                <NewsStatusBadge status={item.status} />
              </div>
              <button
                type="button"
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3 app-news-preview-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>

            <div className="modal-body p-4">
              <small className="text-body-secondary">
                <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                {formatNewsDate(item.publishedAt)}
              </small>
              <h2 id={titleId} className="h4 fw-bold mt-1 mb-2">
                {item.title}
              </h2>
              {item.subtitle && <p className="lead fs-6 text-body-secondary">{item.subtitle}</p>}
              {item.body && <p className="mb-0 text-pre-line">{excerpt(item.body, PREVIEW_LENGTH)}</p>}
            </div>

            <div className="modal-footer justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  aria-label="Previous news"
                  disabled={!hasPrevious}
                  onClick={() => onIndexChange(index - 1)}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                <small className="text-body-secondary" aria-live="polite">
                  {index + 1} / {items.length}
                </small>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  aria-label="Next news"
                  disabled={!hasNext}
                  onClick={() => onIndexChange(index + 1)}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>

              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                  Close
                </button>
                <Link to={`/news/${item.id}`} className="btn btn-primary" onClick={onClose}>
                  Read full article
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default NewsPreviewModal;
