import type { AplCompanyNewsDto } from "../../../services/api/generated/MontraPOSApi";
import { formatDate } from "../../../utils/formatData";

type Props = {
  setSelectedNews: (news: AplCompanyNewsDto | null) => void;
  newsList: AplCompanyNewsDto[];
};

function NewsSearch({ newsList, setSelectedNews }: Props) {
  return (
    <div className="min-vh-100 bg-light">
      <div className="container-fluid py-4">
        <section className="card border-0 shadow-sm rounded-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1 className="h4 fw-bold mb-1">News</h1>
                <p className="text-muted mb-0">
                  Select a news item to open the full detail page.
                </p>
              </div>
              <span className="badge text-bg-secondary">
                {newsList.length} updates
              </span>
            </div>

            <div className="list-group list-group-flush">
              {newsList.map((item) => (
                <button
                  type="button"
                  className="list-group-item list-group-item-action px-0 py-3 news-list-item"
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                >
                  <div className="row g-3 align-items-center">
                    <div className="col-auto">
                      <img
                        src={
                          item.image ? item.image : "/NoImagePlaceholder.png"
                        }
                        alt=""
                        className="news-preview-image"
                      />
                    </div>
                    <div className="col">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className="badge text-bg-primary">
                          {item.aplCompanyNewsType ?? "General"}
                        </span>
                        <span className="small text-muted">
                          {formatDate(item.validityBeginDate ?? "-")}
                        </span>
                      </div>
                      <h2 className="h6 fw-bold mb-1">{item.title}</h2>
                      <p className="text-muted small mb-0 news-preview-text">
                        {item.subtitle}
                      </p>
                    </div>
                    <div className="col-auto text-muted fs-4">›</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default NewsSearch;
