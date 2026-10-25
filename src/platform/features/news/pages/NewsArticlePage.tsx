import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import type { NewsDto } from "@platform/api/generated/MontraPOSApi";
import { useGetNewsTypesQuery } from "../api/newsTypesApi";
import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { NewsCategoryBadge, NewsStatusBadge } from "../components/NewsBadges";
import NewsImage from "../components/NewsImage";
import { useNews } from "../hooks/useNews";
import { formatNewsDate, paragraphs, STATUS_LABELS, toNewsItem } from "../newsModel";
import { listUrl } from "@platform/hooks/listUrl";

const RELATED_LIMIT = 4;

function BackLink() {
  return (
    <Link to={listUrl("/news")} className="link-secondary text-decoration-none small">
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      All news
    </Link>
  );
}

function ArticlePlaceholder() {
  return (
    <div className="placeholder-glow" aria-busy="true">
      <div className="placeholder w-100 rounded-4 app-news-article-hero mb-4" />
      <span className="placeholder col-10 d-block mb-2" />
      <span className="placeholder col-8 d-block mb-2" />
      <span className="placeholder col-6 d-block" />
    </div>
  );
}

// /news/:id: the full article. Works when opened directly (shared link).
export default function NewsArticlePage() {
  return (
    <div className="app-page">
      <NewsArticle />
    </div>
  );
}

function NewsArticle() {
  const { id } = useParams();
  const { items, getById, isLoading, isError, error, refetch } = useNews();
  const [copied, setCopied] = useState(false);

  // Opening another article from "More in this category" starts at the top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  // The dashboard feed has the news valid now; one opened from the search (expired or upcoming)
  // comes with the row's data. A shared link to such a news can't be shown: there's no
  // "news by id" endpoint.
  const fromSearch = (useLocation().state as { news?: NewsDto } | null)?.news;
  const types = useGetNewsTypesQuery();
  const searched = useMemo(() => {
    if (!fromSearch || fromSearch.id !== id) return null;
    return toNewsItem(fromSearch, new Map((types.data ?? []).map((t) => [t.id, t.name])));
  }, [fromSearch, id, types.data]);
  const item = (id ? getById(id) : null) ?? searched;

  if (isLoading) return <ArticlePlaceholder />;

  if (isError) {
    return (
      <div className="d-flex flex-column gap-3">
        <BackLink />
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2 mb-0" role="alert">
          <span className="flex-grow-1">{getApiErrorMessage(error) ?? "Couldn't load the news."}</span>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="d-flex flex-column gap-3">
        <BackLink />
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-file-earmark-x display-5 text-body-secondary" aria-hidden="true" />
            <h2 className="h5 mt-3">News not found</h2>
            <p className="text-body-secondary">It may have been removed, or the link is incorrect.</p>
            <Link to={listUrl("/news")} className="btn btn-primary">
              Browse all news
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const related = items
    .filter((other) => other.id !== item.id && other.category === item.category)
    .sort((a, b) => Number(b.status === "active") - Number(a.status === "active"))
    .slice(0, RELATED_LIMIT);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. non-HTTPS); the URL is still in the address bar
    }
  };

  const body = paragraphs(item.body);

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <BackLink />
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyLink}>
          <i className={`bi ${copied ? "bi-check2" : "bi-link-45deg"} me-1`} aria-hidden="true" />
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>

      <article className="card border-0 shadow-sm overflow-hidden">
        <header className="position-relative app-news-article-hero">
          <NewsImage item={item} />
          <div className="app-news-article-overlay">
            <div className="d-flex flex-wrap gap-2 mb-3">
              <NewsCategoryBadge category={item.category} onImage />
              <NewsStatusBadge status={item.status} />
            </div>
            <h1 className="display-6 fw-bold mb-2">{item.title}</h1>
            {item.subtitle && <p className="lead mb-0 opacity-75">{item.subtitle}</p>}
          </div>
        </header>

        <div className="card-body p-4 p-lg-5">
          <div className="row g-4 g-lg-5">
            <div className="col-12 col-lg-8">
              {body.length > 0 ? (
                body.map((text, i) => (
                  <p key={i} className="fs-5 lh-lg text-pre-line">
                    {text}
                  </p>
                ))
              ) : (
                <p className="text-body-secondary fst-italic">This news item has no further details.</p>
              )}
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary">
                  Read more
                  <i className="bi bi-box-arrow-up-right ms-2" aria-hidden="true" />
                </a>
              )}
            </div>

            <aside className="col-12 col-lg-4 d-flex flex-column gap-4">
              <dl className="row small mb-0 p-3 rounded-3 bg-body-tertiary">
                <dt className="col-5 fw-normal text-body-secondary">Category</dt>
                <dd className="col-7 fw-semibold">{item.category}</dd>
                <dt className="col-5 fw-normal text-body-secondary">Published</dt>
                <dd className="col-7 fw-semibold">{formatNewsDate(item.publishedAt)}</dd>
                {item.expiresAt && (
                  <>
                    <dt className="col-5 fw-normal text-body-secondary">Valid until</dt>
                    <dd className="col-7 fw-semibold">{formatNewsDate(item.expiresAt)}</dd>
                  </>
                )}
                <dt className="col-5 fw-normal text-body-secondary">Status</dt>
                <dd className="col-7 fw-semibold mb-0">{STATUS_LABELS[item.status]}</dd>
              </dl>

              {related.length > 0 && (
                <nav aria-labelledby="related-news-title">
                  <h2 id="related-news-title" className="h6 fw-semibold mb-3">
                    More in {item.category}
                  </h2>
                  <ul className="list-unstyled d-flex flex-column gap-3 mb-0">
                    {related.map((other) => (
                      <li key={other.id}>
                        <Link to={`/news/${other.id}`} className="d-flex gap-3 text-decoration-none text-body app-news-related">
                          <span className="app-news-thumb app-news-thumb-sm">
                            <NewsImage item={other} />
                          </span>
                          <span className="overflow-hidden">
                            <span className="small fw-semibold app-news-clamp-2">{other.title}</span>
                            <small className="text-body-secondary">{formatNewsDate(other.publishedAt)}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}
