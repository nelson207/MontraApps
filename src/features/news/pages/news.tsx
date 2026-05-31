import { useState, type JSX } from "react";

type NewsItem = {
  id: number;
  title: string;
  tag: string;
  image: string;
  summary: string;
  body: string;
  status?: string;
  audience?: string;
  publishedAt?: string;
};

type NewsComponentProps = {
  news?: NewsItem[];
};

const defaultNews: NewsItem[] = [
  {
    id: 1,
    title: "New credit campaign launched",
    tag: "Campaign",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    summary:
      "A new promotional credit campaign is now available for selected intermediaries and points of sale.",
    body: "The campaign includes updated approval conditions, revised simulation rules, and a faster validation flow for qualified customers. Sales teams should review eligibility before creating new proposals.",
    status: "Published",
    audience: "Credit intermediaries, POS and salesmen",
    publishedAt: "2026-05-31",
  },
  {
    id: 2,
    title: "POS performance improved this month",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Point of Sale conversion has improved across several regions compared with the previous reporting period.",
    body: "The strongest improvements were registered in proposal follow-up time and documentation completion. Managers are encouraged to continue monitoring pending contracts closely.",
    status: "Published",
    audience: "Point of sale managers",
    publishedAt: "2026-05-30",
  },
  {
    id: 3,
    title: "Critical tasks require attention",
    tag: "Tasks",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Several critical tasks are pending validation and may affect active contracts if delayed.",
    body: "Tasks marked as critical should be handled first, especially those related to missing documentation, contract validation, or customer approval expiry.",
    status: "Published",
    audience: "Sales operations",
    publishedAt: "2026-05-29",
  },
  {
    id: 4,
    title: "Updated compliance checklist",
    tag: "Compliance",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
    summary:
      "A revised checklist is available for credit intermediaries before submitting customer proposals.",
    body: "The checklist includes identity validation, income confirmation, consent verification, and updated contract disclosure steps.",
    status: "Published",
    audience: "Credit intermediaries",
    publishedAt: "2026-05-28",
  },
  {
    id: 5,
    title: "Faster approval flow available",
    tag: "Approval",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Eligible proposals can now follow a reduced validation path for faster commercial response.",
    body: "The new flow applies to selected customer profiles and requires complete documentation at submission time.",
    status: "Published",
    audience: "Salesmen and backoffice",
    publishedAt: "2026-05-27",
  },
  {
    id: 6,
    title: "Monthly contract targets updated",
    tag: "Targets",
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=80",
    summary:
      "Commercial targets were updated for intermediaries, points of sale and sales teams.",
    body: "Managers can now review updated goals and compare progress against active quotations, proposals and contracts.",
    status: "Published",
    audience: "Managers",
    publishedAt: "2026-05-26",
  },
];

export default function NewsComponent({
  news = defaultNews,
}: NewsComponentProps): JSX.Element {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  if (selectedNews) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container-fluid py-4">
          <button
            type="button"
            className="btn btn-outline-secondary rounded-pill mb-4"
            onClick={() => setSelectedNews(null)}
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
                  {selectedNews.tag}
                </span>
                <h1 className="display-5 fw-bold mb-3">{selectedNews.title}</h1>
                <p className="lead mb-0 col-lg-8">{selectedNews.summary}</p>
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
                      <li>
                        Review the updated information with the sales team.
                      </li>
                      <li>
                        Check affected quotations, proposals or contracts.
                      </li>
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
                    <div className="fw-semibold mb-3">{selectedNews.tag}</div>

                    <div className="small text-muted mb-2">Published at</div>
                    <div className="fw-semibold mb-3">
                      {selectedNews.publishedAt ?? "-"}
                    </div>

                    <div className="small text-muted mb-2">Status</div>
                    <div className="fw-semibold mb-3">
                      {selectedNews.status ?? "Published"}
                    </div>

                    <div className="small text-muted mb-2">Audience</div>
                    <div className="fw-semibold mb-0">
                      {selectedNews.audience ?? "General"}
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
                {news.length} updates
              </span>
            </div>

            <div className="list-group list-group-flush">
              {news.map((item) => (
                <button
                  type="button"
                  className="list-group-item list-group-item-action px-0 py-3 news-list-item"
                  key={item.id}
                  onClick={() => setSelectedNews(item)}
                >
                  <div className="row g-3 align-items-center">
                    <div className="col-auto">
                      <img
                        src={item.image}
                        alt=""
                        className="news-preview-image"
                      />
                    </div>
                    <div className="col">
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className="badge text-bg-primary">
                          {item.tag}
                        </span>
                        <span className="small text-muted">
                          {item.publishedAt ?? "-"}
                        </span>
                      </div>
                      <h2 className="h6 fw-bold mb-1">{item.title}</h2>
                      <p className="text-muted small mb-0 news-preview-text">
                        {item.summary}
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

      <style>{`
        .news-list-item {
          border-radius: 1rem;
          transition: background-color .18s ease, transform .18s ease;
        }

        .news-list-item:hover {
          background-color: var(--bs-light);
          transform: translateX(4px);
        }

        .news-preview-image {
          width: 96px;
          height: 72px;
          object-fit: cover;
          border-radius: 1rem;
        }

        .news-preview-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
