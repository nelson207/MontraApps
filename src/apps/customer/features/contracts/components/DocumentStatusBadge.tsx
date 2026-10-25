import {
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DocumentStatus,
  type PaymentStatus,
} from "../model/contracts";

const DOCUMENT_CLASSES: Record<DocumentStatus, string> = {
  paid: "bg-success-subtle text-success-emphasis border-success-subtle",
  open: "bg-info-subtle text-info-emphasis border-info-subtle",
  overdue: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
};

const PAYMENT_CLASSES: Record<PaymentStatus, string> = {
  paid: "bg-success-subtle text-success-emphasis border-success-subtle",
  overdue: "bg-danger-subtle text-danger-emphasis border-danger-subtle",
  due: "bg-primary-subtle text-primary-emphasis border-primary-subtle",
  scheduled: "bg-body-tertiary text-body-secondary border",
};

export default function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <span className={`badge rounded-pill border ${DOCUMENT_CLASSES[status]}`}>{DOCUMENT_STATUS_LABELS[status]}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge rounded-pill border ${PAYMENT_CLASSES[status]}`}>{PAYMENT_STATUS_LABELS[status]}</span>;
}
