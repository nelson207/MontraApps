import { useEffect, useRef, type ReactNode } from "react";
import { useAppSelector } from "@platform/app/store";
import { formatMoment, isOverdue, priorityOf, workItemTitle, type WorkItem } from "../workItemsModel";
import PriorityBadge from "./PriorityBadge";

type Props = {
  tasks: WorkItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function Detail({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <div className="small text-body-secondary">
        <i className={`bi ${icon} me-1`} aria-hidden="true" />
        {label}
      </div>
      <div className="fw-semibold text-break">{children || "—"}</div>
    </div>
  );
}

// A task in detail, opened from a task list, with ←/→ to browse the listed ones.
// Same behaviour as the news preview: Esc / backdrop close, page scroll locked,
// focus moved into the dialog and back to where it was on close.
function TaskDetailModal({ tasks, index, onIndexChange, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dateFormat = useAppSelector((state) => state.theme.dateFormat);
  const task = tasks[index];
  const hasPrevious = index > 0;
  const hasNext = index < tasks.length - 1;

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

  if (!task) return null;
  const titleId = `task-detail-title-${task.id}`;
  const moment = (iso: string | null | undefined) => formatMoment(iso, dateFormat);
  const overdue = isOverdue(task.dueMoment);
  const priority = priorityOf(task.priorityKind);
  // Priority in its colour (or the API's label when the kind is unknown), then state and type
  const badges = [priority ? null : task.priority, task.state, task.type].filter(Boolean);

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
          <div ref={dialogRef} className="modal-content border-0 shadow-lg" tabIndex={-1}>
            <div className="modal-header align-items-start">
              <div className="min-w-0">
                {(priority || badges.length > 0) && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    {priority && <PriorityBadge priority={priority} />}
                    {badges.map((badge) => (
                      <span key={badge} className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis border">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                <h2 id={titleId} className="h5 fw-bold mb-0">
                  {task.number != null && <span className="text-body-secondary me-2">#{task.number}</span>}
                  {workItemTitle(task)}
                </h2>
              </div>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <Detail icon="bi-calendar-event" label="Due">
                  {task.dueMoment && (
                    <span className={overdue ? "text-danger" : undefined}>
                      {moment(task.dueMoment)}
                      {overdue && <span className="d-block small fw-normal">Overdue</span>}
                    </span>
                  )}
                </Detail>
                <Detail icon="bi-calendar-check" label="Begins">
                  {moment(task.beginDate)}
                </Detail>
                <Detail icon="bi-calendar-plus" label="Created">
                  {moment(task.creationMoment)}
                </Detail>
                <Detail icon="bi-flag" label="State since">
                  {moment(task.stateDate)}
                </Detail>
                <Detail icon="bi-person" label="Assigned to">
                  {task.assignedUser}
                </Detail>
                <Detail icon="bi-building" label="Company">
                  {task.company}
                </Detail>
                <Detail icon="bi-file-earmark-text" label="Operation">
                  {task.credOper}
                </Detail>
                <Detail icon="bi-person-vcard" label="Entity">
                  {task.entity}
                </Detail>
                <Detail icon="bi-link-45deg" label="Related">
                  {task.relatedDescr}
                </Detail>
              </div>
            </div>

            <div className="modal-footer justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  aria-label="Previous task"
                  disabled={!hasPrevious}
                  onClick={() => onIndexChange(index - 1)}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                <small className="text-body-secondary" aria-live="polite">
                  {index + 1} / {tasks.length}
                </small>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  aria-label="Next task"
                  disabled={!hasNext}
                  onClick={() => onIndexChange(index + 1)}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default TaskDetailModal;
