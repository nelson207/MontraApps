import type { CredOperDraft, Insurance } from "../model/credOperDraft";
import { notBeforeToday } from "../validation/dateRules";
import { isEmptyValue, REQUIRED_MESSAGE, type FieldErrors } from "../validation/fieldRules";
import type { LocalDate } from "../validation/localDate";

// Insurance rules (spec §5). Error keys: insurances.{id}.{field}

const linkTarget = (ins: Insurance) => (ins.kind === "car" ? ins.assetRef : ins.interventionRef);

function linkExists(ins: Insurance, op: CredOperDraft): boolean {
  return ins.kind === "car"
    ? !!op.assets?.some((a) => a.correlationID === ins.assetRef)
    : !!op.interventions?.some((i) => i.correlationID === ins.interventionRef);
}

export function validateInsurance(ins: Insurance, op: CredOperDraft, today: LocalDate): FieldErrors {
  const errors: FieldErrors = {};
  const key = (field: string) => `insurances.${ins.id}.${field}`;

  if (!linkExists(ins, op)) {
    errors[key("link")] =
      ins.kind === "car" ? "The insured vehicle no longer exists." : "The insured person no longer exists.";
  }
  if (!ins.insuranceTypeId) errors[key("insuranceTypeId")] = "Select an insurance type.";

  if (ins.kind === "car") {
    const { driver } = ins;
    if (isEmptyValue(driver.licenseExpiryDate)) {
      errors[key("driver.licenseExpiryDate")] = REQUIRED_MESSAGE;
    } else {
      const expired = notBeforeToday(driver.licenseExpiryDate, today, "Driver license");
      if (expired) errors[key("driver.licenseExpiryDate")] = expired;
    }
    if (!driver.mainDriverIsCustomer) {
      if (isEmptyValue(driver.name)) errors[key("driver.name")] = REQUIRED_MESSAGE;
      if (isEmptyValue(driver.licenseNumber)) errors[key("driver.licenseNumber")] = REQUIRED_MESSAGE;
    }
    if (ins.protectionIds.length === 0) errors[key("protectionIds")] = "Select at least one protection.";
  }

  return errors;
}

/** Same kind + type + insured person/vehicle as an entry earlier in the list (the first one stays valid). */
export function isDuplicate(candidate: Insurance, all: Insurance[]): boolean {
  const index = all.findIndex((i) => i.id === candidate.id);
  const earlier = index === -1 ? all : all.slice(0, index);
  return earlier.some(
    (other) =>
      other.id !== candidate.id &&
      other.kind === candidate.kind &&
      other.insuranceTypeId === candidate.insuranceTypeId &&
      linkTarget(other) === linkTarget(candidate),
  );
}

export const DUPLICATE_MESSAGE = "This insurance type is already added for this person/vehicle.";

export function validateInsurances(op: CredOperDraft, today: LocalDate): FieldErrors {
  return op.insurances.reduce<FieldErrors>((errors, ins) => {
    Object.assign(errors, validateInsurance(ins, op, today));
    if (isDuplicate(ins, op.insurances)) errors[`insurances.${ins.id}.duplicate`] = DUPLICATE_MESSAGE;
    return errors;
  }, {});
}
