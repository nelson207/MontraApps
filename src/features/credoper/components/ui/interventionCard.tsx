import type { InterventionRole } from "../../types/credoperTypes";

type Intervention = {
  id: string;
  role: InterventionRole;
  name?: string;
};

type Props = {
  intervention: Intervention;
  isSelected?: boolean;
  disableRemove?: boolean;
  onSelect?: (id: string) => void;
  onRemove?: (id: string) => void;
  onDragStart?: (id: string) => void;
  onDragOver?: (id: string) => void;
  onDrop?: (id: string) => void;
};

function getRoleBadge(role: InterventionRole) {
  switch (role) {
    case "CUSTOMER":
      return "bg-primary";
    case "SECOND_HOLDER":
      return "bg-info text-dark";
    case "GUARANTOR":
      return "bg-secondary";
  }
}

function getRoleLabel(role: InterventionRole) {
  switch (role) {
    case "CUSTOMER":
      return "Customer";
    case "SECOND_HOLDER":
      return "Second Holder";
    case "GUARANTOR":
      return "Guarantor";
  }
}

export default function InterventionCard({
  intervention,
  isSelected,
  disableRemove,
  onSelect,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
}: Props) {
  return (
    <div
      className={`card mb-2 shadow-sm ${isSelected ? "border-primary" : ""}`}
      draggable
      onDragStart={() => onDragStart?.(intervention.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(intervention.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(intervention.id);
      }}
      onClick={() => onSelect?.(intervention.id)}
      style={{ cursor: "move" }}
    >
      <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center">
        <div>
          <div className="fw-semibold">{intervention.name || "Unnamed"}</div>
          <span className={`badge ${getRoleBadge(intervention.role)}`}>
            {getRoleLabel(intervention.role)}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">⋮⋮</span>

          {!disableRemove && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(intervention.id);
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
