import { useNavigate } from "react-router-dom";
import type { AplCompanyNewsDto } from "../../../services/api/generated/MontraPOSApi";
import { useState } from "react";

type Props = {
  newsList: AplCompanyNewsDto[];
  selectedNews: AplCompanyNewsDto | null;
  setSelectedNews: (news: AplCompanyNewsDto | null) => void;
};

function NewsGallery({ newsList, selectedNews, setSelectedNews }: Props) {
  const navigate = useNavigate();
  const [newsStartIndex, setNewsStartIndex] = useState<number>(0);
  const visibleNewsLimit = 4;
  const canScrollNews = newsList.length > visibleNewsLimit;
  const visibleNews = newsList.slice(
    newsStartIndex,
    newsStartIndex + visibleNewsLimit,
  );

  const scrollNews = (direction: "previous" | "next"): void => {
    setNewsStartIndex((current) => {
      if (direction === "previous") {
        return Math.max(0, current - visibleNewsLimit);
      }

      return Math.min(
        newsList.length - visibleNewsLimit,
        current + visibleNewsLimit,
      );
    });
  };

  function truncateText(value?: string | null, maxLength = 100): string {
    if (!value) return "";

    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  return (
    <>
      <section className="mb-4" style={{ maxHeight: "40vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            {canScrollNews && (
              <small className="text-muted">
                Showing {newsStartIndex + 1}-
                {Math.min(newsStartIndex + visibleNewsLimit, newsList.length)}{" "}
                of {newsList.length}
              </small>
            )}
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-secondary">
              {newsList.length} updates
            </span>
            {canScrollNews && (
              <div
                className="btn-group"
                role="group"
                aria-label="News gallery navigation"
              >
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-start-pill"
                  disabled={newsStartIndex === 0}
                  onClick={() => scrollNews("previous")}
                  aria-label="Previous news"
                ></button>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-end-pill"
                  disabled={
                    newsStartIndex + visibleNewsLimit >= newsList.length
                  }
                  onClick={() => scrollNews("next")}
                  aria-label="Next news"
                ></button>
              </div>
            )}
          </div>
        </div>

        <div className="row g-3 h-100">
          {visibleNews.map((item, index) => (
            <div
              className={
                index === 0 ? "col-12 col-lg-6" : "col-12 col-md-4 col-lg-2"
              }
              key={item.id}
            >
              <button
                type="button"
                className="card border-0 shadow-sm text-start overflow-hidden w-100 h-100 news-card"
                onClick={() => setSelectedNews(item)}
                style={{ minHeight: index === 0 ? "330px" : "160px" }}
              >
                <div
                  className="position-relative h-100"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.75)), url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="position-absolute top-0 start-0 m-3">
                    <span className="badge text-bg-light">
                      {item.aplCompanyNewsType ?? "General"}
                    </span>
                  </div>
                  <div className="position-absolute bottom-0 start-0 end-0 p-3 text-white">
                    <h3 className={index === 0 ? "h4 fw-bold" : "h6 fw-bold"}>
                      {truncateText(item.title, 100)}
                    </h3>
                    <p className="small mb-0 opacity-75">
                      {truncateText(item.subtitle, 100)}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </section>
      {selectedNews && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,.55)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div
                className="modal-header text-white border-0"
                style={{
                  minHeight: "220px",
                  backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.2), rgba(0,0,0,.75)), url(${selectedNews.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="align-self-end">
                  <span className="badge text-bg-light mb-2">
                    {selectedNews.aplCompanyNewsType ?? "General"}
                  </span>
                  <h5 className="modal-title fs-3 fw-bold">
                    {selectedNews.title}
                  </h5>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white align-self-start"
                  aria-label="Close"
                  onClick={() => setSelectedNews(null)}
                />
              </div>
              <div className="modal-body p-4">
                <p className="lead">{selectedNews.subtitle}</p>
                <p className="mb-0 text-muted">{selectedNews.body}</p>
              </div>
              <div className="modal-footer border-0 px-4 pb-4">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setSelectedNews(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary rounded-pill px-4"
                  onClick={() => {
                    navigate(`/news/${selectedNews.id}`);
                  }}
                >
                  Open details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NewsGallery;
