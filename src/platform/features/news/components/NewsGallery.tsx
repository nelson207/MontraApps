import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatRelativeTime } from "@platform/utils/formatRelativeTime";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useNews } from "../hooks/useNews";
import type { NewsItem } from "../newsModel";
import NewsImage from "./NewsImage";
import NewsPreviewModal from "./NewsPreviewModal";

const PAGE_SIZE = 4;

const when = (item: NewsItem) =>
  item.publishedAt ? formatRelativeTime(item.publishedAt) : "";

/** Same frame as the other dashboard sections (white card, h5 heading). */
function GalleryCard({
  actions,
  children,
}: {
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="card border-0 shadow-sm"
      aria-labelledby="news-gallery-title"
    >
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <h2 id="news-gallery-title" className="h5 fw-semibold mb-0">
            Latest news
          </h2>
          {actions}
        </div>
        {children}
      </div>
    </section>
  );
}

// Dashboard: a compact strip with the latest current news; a tile opens the preview.
// Renders nothing when there is no news at all, so the dashboard stays clean.
function NewsGallery() {
  const { items, active, isLoading, isError, error, refetch, isSample } =
    useNews();
  const [start, setStart] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <GalleryCard>
        <div className="app-news-strip placeholder-glow" aria-busy="true">
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <div
              key={i}
              className="placeholder rounded-3 app-news-tile-placeholder"
            />
          ))}
        </div>
      </GalleryCard>
    );
  }

  if (isError) {
    return (
      <GalleryCard>
        <div
          className="d-flex flex-wrap align-items-center gap-2 small text-body-secondary"
          role="alert"
        >
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
      </GalleryCard>
    );
  }

  // Nothing current (no news at all, or only old / upcoming ones): the same card, with an
  // empty state the height of the strip, so the dashboard keeps its layout
  if (active.length === 0) {
    const hasArchive = items.length > 0;
    return (
      <GalleryCard
        actions={
          hasArchive && (
            <Link to="/news" className="btn btn-outline-secondary btn-sm">
              Browse all news
              <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
            </Link>
          )
        }
      >
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
      </GalleryCard>
    );
  }

  const visible = active.slice(start, start + PAGE_SIZE);
  const canPage = active.length > PAGE_SIZE;

  const actions = (
    <div className="d-flex align-items-center gap-2">
      {isSample && (
        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border">
          Sample data
        </span>
      )}
      {canPage && (
        <>
          <small className="text-body-secondary d-none d-sm-inline">
            {start + 1}–{Math.min(start + PAGE_SIZE, active.length)} of{" "}
            {active.length}
          </small>
          <div
            className="btn-group btn-group-sm"
            role="group"
            aria-label="Browse news"
          >
            <button
              type="button"
              className="btn btn-outline-secondary"
              aria-label="Previous news"
              disabled={start === 0}
              onClick={() => setStart((s) => Math.max(0, s - PAGE_SIZE))}
            >
              <i className="bi bi-chevron-left" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              aria-label="Next news"
              disabled={start + PAGE_SIZE >= active.length}
              onClick={() => setStart((s) => s + PAGE_SIZE)}
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </>
      )}
      <Link to="/news" className="btn btn-outline-secondary btn-sm">
        View all
        <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
      </Link>
    </div>
  );

  return (
    <GalleryCard actions={actions}>
      <div className="app-news-strip">
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            className="app-news-tile"
            onClick={() => setPreviewIndex(active.indexOf(item))}
          >
            <span className="app-news-tile-image">
              <NewsImage item={item} />
            </span>
            <span className="app-news-tile-body">
              <small className="d-block text-body-secondary text-truncate">
                {item.category} · {when(item)}
              </small>
              <span className="fw-semibold small app-news-clamp-2">
                {item.title}
              </span>
            </span>
          </button>
        ))}
      </div>

      {previewIndex !== null && (
        <NewsPreviewModal
          items={active}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </GalleryCard>
  );
}

export default NewsGallery;
