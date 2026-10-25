import type { CredOperDraft } from "../model/credOperDraft";
import { addError, checkRequired, fieldRule, type FieldErrors } from "../validation/fieldRules";
import type { LocalDate } from "../validation/localDate";

// Customer step (quotation / proposal): the commercial network and the customer's contacts,
// required as the server's field rules say. Error keys are the fields' paths.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomer(op: CredOperDraft, _today: LocalDate): FieldErrors {
  const errors: FieldErrors = {};
  const meta = op.metadataResponse;

  checkRequired(errors, meta, "creditIntermediaryStructNode", "creditIntermediaryStructNode", op.creditIntermediaryStructNode);
  checkRequired(errors, meta, "showRoomStructNode", "showRoomStructNode", op.showRoomStructNode);
  checkRequired(errors, meta, "salePersonStructNode", "salePersonStructNode", op.salePersonStructNode);
  checkRequired(errors, meta, "customerName", "customerName", op.customerName);
  checkRequired(errors, meta, "customerVAT", "customerVAT.legalDocNumber", op.customerVAT?.legalDocNumber);
  checkRequired(errors, meta, "customerEmail", "customerEmail.email", op.customerEmail?.email);
  checkRequired(errors, meta, "customerPhone", "customerPhone.phoneNumber", op.customerPhone?.phoneNumber);
  checkRequired(errors, meta, "customerLandLine", "customerLandLine.phoneNumber", op.customerLandLine?.phoneNumber);

  const email = op.customerEmail?.email?.trim();
  if (email && fieldRule(meta, "customerEmail").visible && !EMAIL_PATTERN.test(email)) {
    addError(errors, "customerEmail.email", "Enter a valid e-mail address.");
  }
  return errors;
}
