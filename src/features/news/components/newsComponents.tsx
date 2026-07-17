import { useNavigate } from "react-router-dom";
import type { AplCompanyNewsDto } from "../../../services/api/generated/MontraPOSApi";
import { formatDate } from "../../../utils/formatData";

type Props = {
  selectedNews: AplCompanyNewsDto | null;
  setSelectedNews: (news: AplCompanyNewsDto | null) => void;
};

function NewsComponent({ selectedNews, setSelectedNews }: Props) {
  if (!selectedNews) return null;
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-light">
      <div className="container-fluid py-4">
        <button
          type="button"
          className="btn btn-outline-secondary rounded-pill mb-4"
          onClick={() => {
            setSelectedNews(null);
            navigate("/news");
          }}
        >
          ← Back to news
        </button>

        <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div
            className="news-detail-hero text-white d-flex align-items-end"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.78)), url(${selectedNews.image})`,
            }}
          >
            <div className="p-4 p-lg-5">
              <span className="badge text-bg-light mb-3">
                {selectedNews.aplCompanyNewsType ?? "General"}
              </span>
              <h1 className="display-5 fw-bold mb-3">{selectedNews.title}</h1>
              <p className="lead mb-0 col-lg-8">{selectedNews.subtitle}</p>
            </div>
          </div>

          <div className="card-body p-4 p-lg-5">
            <div className="row g-4">
              <div className="col-12 col-lg-8">
                <h2 className="h4 fw-bold mb-3">News detail</h2>
                <p className="fs-5 text-muted">{selectedNews.body}</p>

                <div className="border rounded-4 p-4 bg-light mt-4">
                  <h3 className="h6 fw-bold mb-2">Recommended actions</h3>
                  <ul className="mb-0">
                    <li>Review the updated information with the sales team.</li>
                    <li>Check affected quotations, proposals or contracts.</li>
                    <li>
                      Contact the responsible intermediary if action is
                      required.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="border rounded-4 p-4 bg-white h-100">
                  <h3 className="h6 fw-bold mb-3">News information</h3>
                  <div className="small text-muted mb-2">Category</div>
                  <div className="fw-semibold mb-3">
                    {selectedNews.aplCompanyNewsType ?? "General"}
                  </div>

                  <div className="small text-muted mb-2">Published at</div>
                  <div className="fw-semibold mb-3">
                    {formatDate(selectedNews.validityBeginDate ?? "-")}
                  </div>

                  <div className="small text-muted mb-2">Status</div>
                  <div className="fw-semibold mb-3">
                    {selectedNews.validityEndDate == null
                      ? "Published"
                      : "Expired"}
                  </div>

                  <div className="small text-muted mb-2">Audience</div>
                  <div className="fw-semibold mb-0">
                    {selectedNews.aplCompanyNewsType ?? "General"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
          .news-detail-hero {
            min-height: 460px;
            background-size: cover;
            background-position: center;
          }
        `}</style>
    </div>
  );
}

export default NewsComponent;
