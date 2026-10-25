import { nodeFromId } from "@platform/features/workContext/nodeLabels";
import { businessOf } from "../../model/business";
import type { CredOperDraft, Stage } from "../../model/credOperDraft";

const STAGE_LABELS: Record<Stage, string> = { quotation: "Quotation", proposal: "Proposal" };

const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" });

function formatEntryDate(value?: string) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : null;
}

type Props = { stage: Stage; operation: CredOperDraft; isDirty: boolean };

// "New quotation" / "Quotation #n" / "Proposal #n", save state, business, and where it belongs.
function OperationHeader({ stage, operation, isDirty }: Props) {
  const number = operation.credOperNumber ?? operation.id;
  const isSaved = operation.id != null;
  const title = isSaved ? `${STAGE_LABELS[stage]} #${number}` : `New ${STAGE_LABELS[stage].toLowerCase()}`;

  const badge = isDirty
    ? { label: "Unsaved changes", className: "bg-warning-subtle text-warning-emphasis border-warning-subtle" }
    : isSaved
      ? { label: "Saved", className: "bg-success-subtle text-success-emphasis border-success-subtle" }
      : { label: "Draft", className: "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle" };

  const network = [
    nodeFromId("organization", operation.creditIntermediaryStructNode)?.name,
    nodeFromId("unit", operation.showRoomStructNode)?.name,
    nodeFromId("member", operation.salePersonStructNode)?.name,
  ].filter(Boolean);
  const created = formatEntryDate(operation.entryDate);
  const business = businessOf(operation);

  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <h2 className="h4 fw-bold mb-0">{title}</h2>
      <span className={`badge rounded-pill border ${badge.className}`}>{badge.label}</span>
      {business && (
        <span className="badge rounded-pill bg-body-tertiary text-body border">
          <i className={`bi ${business.icon} me-1`} aria-hidden="true" />
          {business.label}
        </span>
      )}
      {(network.length > 0 || created) && (
        <small className="text-body-secondary w-100">
          {network.join(" › ")}
          {network.length > 0 && created && " · "}
          {created && `Created ${created}`}
        </small>
      )}
    </div>
  );
}

export default OperationHeader;
