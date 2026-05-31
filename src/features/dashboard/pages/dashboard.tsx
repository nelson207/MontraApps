import { useMemo, useState, type JSX } from "react";

type NewsItem = {
  id: number;
  title: string;
  tag: string;
  image: string;
  summary: string;
  body: string;
};

type Priority = "Low" | "Medium" | "High" | "Critical";

type TaskType = "Contracts" | "Proposals" | "Quotations" | "Point of Sale";

type Task = {
  id: number;
  title: string;
  owner: string;
  priority: Priority;
  type: TaskType;
  due: string;
};

type PipelineGroup = "Quotations" | "Proposals" | "Contracts";

type PipelineRow = {
  label: string;
  value: number;
};

type Filters = {
  intermediary: string;
  pos: string;
  salesman: string;
  startDate: string;
  endDate: string;
};

const newsItems: NewsItem[] = [
  {
    id: 1,
    title: "New credit campaign launched",
    tag: "Campaign",
    image:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
    summary:
      "A new promotional credit campaign is now available for selected intermediaries and points of sale.",
    body: "The campaign includes updated approval conditions, revised simulation rules, and a faster validation flow for qualified customers. Sales teams should review eligibility before creating new proposals.",
  },
  {
    id: 2,
    title: "POS performance improved this month",
    tag: "Performance",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
    summary:
      "Point of Sale conversion has improved across several regions compared with the previous reporting period.",
    body: "The strongest improvements were registered in proposal follow-up time and documentation completion. Managers are encouraged to continue monitoring pending contracts closely.",
  },
  {
    id: 3,
    title: "Critical tasks require attention",
    tag: "Tasks",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    summary:
      "Several critical tasks are pending validation and may affect active contracts if delayed.",
    body: "Tasks marked as critical should be handled first, especially those related to missing documentation, contract validation, or customer approval expiry.",
  },
  {
    id: 4,
    title: "Updated compliance checklist",
    tag: "Compliance",
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
    summary:
      "A revised checklist is available for credit intermediaries before submitting customer proposals.",
    body: "The checklist includes identity validation, income confirmation, consent verification, and updated contract disclosure steps.",
  },
  {
    id: 5,
    title: "Faster approval flow available",
    tag: "Approval",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80",
    summary:
      "Eligible proposals can now follow a reduced validation path for faster commercial response.",
    body: "The new flow applies to selected customer profiles and requires complete documentation at submission time.",
  },
  {
    id: 6,
    title: "Monthly contract targets updated",
    tag: "Targets",
    image:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=80",
    summary:
      "Commercial targets were updated for intermediaries, points of sale and sales teams.",
    body: "Managers can now review updated goals and compare progress against active quotations, proposals and contracts.",
  },
];

const tasks: Task[] = [
  {
    id: 1,
    title: "Validate missing customer documents",
    owner: "Ana Silva",
    priority: "Critical",
    type: "Contracts",
    due: "Today",
  },
  {
    id: 2,
    title: "Review proposal conditions",
    owner: "Miguel Costa",
    priority: "High",
    type: "Proposals",
    due: "Tomorrow",
  },
  {
    id: 3,
    title: "Follow up quotation approval",
    owner: "João Pereira",
    priority: "Medium",
    type: "Quotations",
    due: "2 days",
  },
  {
    id: 4,
    title: "Update POS sales notes",
    owner: "Carla Martins",
    priority: "Low",
    type: "Point of Sale",
    due: "This week",
  },
  {
    id: 5,
    title: "Confirm signed contract upload",
    owner: "Ana Silva",
    priority: "High",
    type: "Contracts",
    due: "Today",
  },
];

const pipeline: Record<PipelineGroup, PipelineRow[]> = {
  Quotations: [
    { label: "Open", value: 18 },
    { label: "Pending Client", value: 7 },
    { label: "Expired", value: 3 },
  ],
  Proposals: [
    { label: "In Analysis", value: 12 },
    { label: "Approved", value: 9 },
    { label: "Rejected", value: 2 },
  ],
  Contracts: [
    { label: "Awaiting Signature", value: 6 },
    { label: "Validation", value: 4 },
    { label: "Completed", value: 21 },
  ],
};

const priorityClass: Record<Priority, string> = {
  Low: "success",
  Medium: "warning",
  High: "danger",
  Critical: "dark",
};

const emptyFilters: Filters = {
  intermediary: "All",
  pos: "All",
  salesman: "All",
  startDate: "",
  endDate: "",
};

export default function DashboardPage(): JSX.Element {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [newsStartIndex, setNewsStartIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"tasks" | "commercial">("tasks");
  const [selectedPriority, setSelectedPriority] = useState<Priority[]>([
    "Low",
    "Medium",
    "High",
    "Critical",
  ]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const visibleNewsLimit = 4;
  const canScrollNews = newsItems.length > visibleNewsLimit;
  const visibleNews = newsItems.slice(
    newsStartIndex,
    newsStartIndex + visibleNewsLimit,
  );

  const scrollNews = (direction: "previous" | "next"): void => {
    setNewsStartIndex((current) => {
      if (direction === "previous") {
        return Math.max(0, current - visibleNewsLimit);
      }

      return Math.min(
        newsItems.length - visibleNewsLimit,
        current + visibleNewsLimit,
      );
    });
  };

  const priorityResume = useMemo(() => {
    const priorities: Priority[] = ["Low", "Medium", "High", "Critical"];

    return priorities.map((priority) => ({
      priority,
      count: tasks.filter((task) => task.priority === priority).length,
    }));
  }, []);

  const selectedPriorityTasks = useMemo(() => {
    if (!selectedPriority) {
      return [];
    }

    return tasks.filter((task) => selectedPriority.includes(task.priority));
  }, [selectedPriority]);

  const updateFilter = <K extends keyof Filters>(
    field: K,
    value: Filters[K],
  ): void => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="min-vh-100 bg-light">
      <div className="container-fluid py-4">
        <section className="mb-4" style={{ maxHeight: "40vh" }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              {canScrollNews && (
                <small className="text-muted">
                  Showing {newsStartIndex + 1}-
                  {Math.min(
                    newsStartIndex + visibleNewsLimit,
                    newsItems.length,
                  )}{" "}
                  of {newsItems.length}
                </small>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="badge text-bg-secondary">
                {newsItems.length} updates
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
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm rounded-end-pill"
                    disabled={
                      newsStartIndex + visibleNewsLimit >= newsItems.length
                    }
                    onClick={() => scrollNews("next")}
                    aria-label="Next news"
                  >
                    ›
                  </button>
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
                      <span className="badge text-bg-light">{item.tag}</span>
                    </div>
                    <div className="position-absolute bottom-0 start-0 end-0 p-3 text-white">
                      <h3 className={index === 0 ? "h4 fw-bold" : "h6 fw-bold"}>
                        {item.title}
                      </h3>
                      <p className="small mb-0 opacity-75">{item.summary}</p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h5 fw-semibold mb-0">Filters</h2>
              <div>
                {activeTab === "tasks" && (
                  <button
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={() => setSelectedPriority([])}
                  >
                    Clear priorities
                  </button>
                )}
                <button
                  className="btn btn-outline-secondary btn-sm ms-2"
                  onClick={() => setFilters(emptyFilters)}
                >
                  Clear filters
                </button>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label fw-medium">
                  Credit Intermediary
                </label>
                <select
                  className="form-select"
                  value={filters.intermediary}
                  onChange={(event) =>
                    updateFilter("intermediary", event.target.value)
                  }
                >
                  <option>All</option>
                  <option>Intermediary North</option>
                  <option>Intermediary Central</option>
                  <option>Intermediary South</option>
                </select>
              </div>

              <div className="col-12 col-md-6 col-xl-3">
                <label className="form-label fw-medium">Point of Sale</label>
                <select
                  className="form-select"
                  value={filters.pos}
                  onChange={(event) => updateFilter("pos", event.target.value)}
                >
                  <option>All</option>
                  <option>Lisbon Store</option>
                  <option>Porto Store</option>
                  <option>Online Channel</option>
                </select>
              </div>

              <div className="col-12 col-md-6 col-xl-2">
                <label className="form-label fw-medium">Salesman</label>
                <select
                  className="form-select"
                  value={filters.salesman}
                  onChange={(event) =>
                    updateFilter("salesman", event.target.value)
                  }
                >
                  <option>All</option>
                  <option>Ana Silva</option>
                  <option>Miguel Costa</option>
                  <option>João Pereira</option>
                  <option>Carla Martins</option>
                </select>
              </div>

              <div className="col-12 col-md-3 col-xl-2">
                <label className="form-label fw-medium">Start date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.startDate}
                  onChange={(event) =>
                    updateFilter("startDate", event.target.value)
                  }
                />
              </div>

              <div className="col-12 col-md-3 col-xl-2">
                <label className="form-label fw-medium">End date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.endDate}
                  onChange={(event) =>
                    updateFilter("endDate", event.target.value)
                  }
                />
              </div>
            </div>
          </div>
          <div className="card-header bg-white border-0 pt-3 px-3">
            <ul className="nav nav-pills gap-2" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link rounded-pill ${activeTab === "tasks" ? "active" : ""}`}
                  onClick={() => setActiveTab("tasks")}
                >
                  Tasks assigned
                  <span
                    className={`badge ms-2 ${activeTab === "tasks" ? "text-bg-light" : "text-bg-primary"}`}
                  >
                    {tasks.length}
                  </span>
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  type="button"
                  className={`nav-link rounded-pill ${activeTab === "commercial" ? "active" : ""}`}
                  onClick={() => setActiveTab("commercial")}
                >
                  Commercial resume
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body">
            {activeTab === "tasks" && (
              <div>
                <div className="row g-3 mb-4">
                  {priorityResume.map((item) => (
                    <div className="col-6 col-lg-3" key={item.priority}>
                      <button
                        type="button"
                        className={`border rounded-4 p-3 bg-white h-100 w-100 text-start priority-card ${
                          selectedPriority?.includes(item.priority)
                            ? "priority-card-active"
                            : ""
                        }`}
                        onClick={() => {
                          if (selectedPriority?.includes(item.priority)) {
                            setSelectedPriority(
                              selectedPriority?.filter(
                                (p) => p !== item.priority,
                              ),
                            );
                          } else {
                            setSelectedPriority([
                              ...(selectedPriority || []),
                              item.priority,
                            ]);
                          }
                        }}
                      >
                        <span
                          className={`badge text-bg-${priorityClass[item.priority]} mb-2`}
                        >
                          {item.priority}
                        </span>
                        <div className="display-6 fw-bold">{item.count}</div>
                        <div className="small text-muted">assigned</div>
                      </button>
                    </div>
                  ))}
                </div>

                {!selectedPriority && (
                  <div className="alert alert-light border mb-0">
                    Select Low, Medium, High or Critical to open the related
                    task detail.
                  </div>
                )}

                {selectedPriority && (
                  <div>
                    <div className="list-group list-group-flush">
                      {selectedPriorityTasks.map((task) => (
                        <div
                          className="list-group-item px-0 py-3"
                          key={task.id}
                        >
                          <div className="d-flex flex-wrap justify-content-between gap-2">
                            <div>
                              <h4 className="h6 fw-semibold mb-1">
                                {task.title}
                              </h4>
                              <div className="small text-muted">
                                {task.owner} · {task.type} · Due {task.due}
                              </div>
                            </div>
                            <span
                              className={`badge align-self-start text-bg-${priorityClass[task.priority]}`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "commercial" && (
              <div>
                <h2 className="h5 fw-semibold mb-3">Commercial Resume</h2>

                {Object.entries(pipeline).map(([group, rows], index) => (
                  <div
                    key={group}
                    className={index === 0 ? "pb-3" : "border-top pt-3 pb-3"}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h3 className="h6 fw-bold mb-0">{group}</h3>
                      <span className="badge text-bg-primary">
                        {rows.reduce((sum, row) => sum + row.value, 0)}
                      </span>
                    </div>
                    <div className="row g-2">
                      {rows.map((row) => (
                        <div className="col-12 col-md-4" key={row.label}>
                          <div className="bg-light rounded-4 p-3 text-center h-100">
                            <div className="fw-bold fs-4">{row.value}</div>
                            <div className="small text-muted">{row.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

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
                    {selectedNews.tag}
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
                <p className="lead">{selectedNews.summary}</p>
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
                >
                  Open details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .news-card {
          border-radius: 1.25rem;
          transition: transform .18s ease, box-shadow .18s ease;
        }

        .news-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 1rem 2rem rgba(0,0,0,.16) !important;
        }

        .priority-card {
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }

        .priority-card:hover,
        .priority-card-active {
          transform: translateY(-2px);
          border-color: var(--bs-primary) !important;
          box-shadow: 0 .75rem 1.5rem rgba(0,0,0,.1);
        }
      `}</style>
    </div>
  );
}
