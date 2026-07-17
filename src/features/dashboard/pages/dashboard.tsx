import { useEffect, useMemo, useState, type JSX } from "react";
import { useNews } from "../../news/hooks/useNews";
import NewsGallery from "../../news/components/newsGallery";

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
  const news = useNews();
  const [activeTab, setActiveTab] = useState<"tasks" | "commercial">("tasks");
  const [selectedPriority, setSelectedPriority] = useState<Priority[]>([
    "Low",
    "Medium",
    "High",
    "Critical",
  ]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

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

  useEffect(() => {
    if (news.newsListData) {
      news.setNewsList(news.newsListData);
    }
  }, [news.newsListData]);

  return (
    <div className="min-vh-100 bg-light">
      <div className="container-fluid py-4">
        <NewsGallery {...news} />
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
    </div>
  );
}
