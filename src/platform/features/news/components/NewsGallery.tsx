import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatRelativeTime } from "@platform/utils/formatRelativeTime";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useNews } from "../hooks/useNews";
import type { NewsItem } from "../newsModel";
import NewsImage from "./NewsImage";
import NewsPreviewModal from "./NewsPreviewModal";

const PAGE_SIZE = 3;

const when = (item: NewsItem) =>
  item.publishedAt ? formatRelativeTime(item.publishedAt) : "";

/** The section's heading row: title, then the actions on the right. */
function GallerySection({
  actions,
  children,
}: {
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="app-news-gallery" aria-labelledby="news-gallery-title">
      <div className="app-section-head">
        <h2 id="news-gallery-title" className="app-section-title">
          Latest news
        </h2>
        <div className="d-flex align-items-center gap-2 ms-auto">{actions}</div>
      </div>
      {children}
    </section>
  );
}

const allNewsLink = (label: string) => (
  <Link to="/news" className="app-section-link">
    {label}
    <i className="bi bi-chevron-right small" aria-hidden="true" />
  </Link>
);

// Dashboard: one row of three cards with the latest current news; more than three become a
// paged gallery (previous / next and page dots). A card opens the preview.
function NewsGallery() {
  const { items, active, isLoading, isError, error, refetch, isSample } =
    useNews();
  const [page, setPage] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <GallerySection>
        <div className="app-news-grid placeholder-glow" aria-busy="true">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div key={i} className="placeholder app-news-card-placeholder" />
          ))}
        </div>
      </GallerySection>
    );
  }

  if (isError) {
    return (
      <GallerySection>
        <div className="app-news-message" role="alert">
          <i
            className="bi bi-exclamation-triangle text-warning"
            aria-hidden="true"
          />
          <span className="flex-grow-1">
            Couldn't load the latest news. {getApiErrorMessage(error) ?? ""}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </div>
      </GallerySection>
    );
  }

  // Nothing current (no news at all, or only old / upcoming ones): the same section, with an
  // empty state the height of the cards, so the dashboard keeps its layout
  if (active.length === 0) {
    const hasArchive = items.length > 0;
    return (
      <GallerySection actions={hasArchive && allNewsLink("Browse all news")}>
        <div className="app-news-empty" role="status">
          <span className="app-news-empty-icon" aria-hidden="true">
            <i className="bi bi-newspaper" />
          </span>
          <span className="fw-semibold">No news available at this time</span>
          <span className="small text-body-secondary">
            {hasArchive
              ? "There's nothing current right now. Older and upcoming news are in the archive."
              : "When news is published for your network, it will appear here."}
          </span>
        </div>
      </GallerySection>
    );
  }

  const pages = Math.ceil(active.length / PAGE_SIZE);
  // The news can shrink after a reload: stay on a page that exists
  const current = Math.min(page, pages - 1);
  const visible = active.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const isGallery = pages > 1;

  const actions = (
    <>
      {isSample && (
        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border">
          Sample data
        </span>
      )}
      {allNewsLink("All news")}
      {isGallery && (
        <>
          <button
            type="button"
            className="app-round-btn"
            aria-label="Previous news"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <i className="bi bi-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="app-round-btn"
            aria-label="Next news"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </button>
        </>
      )}
    </>
  );

  return (
    <GallerySection actions={actions}>
      <div className="app-news-grid">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className="app-news-card"
            aria-haspopup="dialog"
            onClick={() => setPreviewIndex(active.indexOf(item))}
          >
            <span className="app-news-card-image">
              <NewsImage item={item} />
            </span>
            <span className="app-news-card-body">
              <small className="text-body-secondary text-truncate">
                {item.category} · {when(item)}
              </small>
              <span className="app-news-card-title app-news-clamp-2">
                {item.title}
              </span>
              {item.subtitle && (
                <span className="app-news-card-excerpt app-news-clamp-2">
                  {item.subtitle}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {isGallery && (
        <div className="app-news-dots">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`app-news-dot ${i === current ? "is-current" : ""}`}
              aria-label={`News page ${i + 1} of ${pages}`}
              aria-current={i === current ? "true" : undefined}
              onClick={() => setPage(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}

      {previewIndex !== null && (
        <NewsPreviewModal
          items={active}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </GallerySection>
  );
}

export default NewsGallery;
