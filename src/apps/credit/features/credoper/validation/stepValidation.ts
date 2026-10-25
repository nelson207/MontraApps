import { validateInsurances } from "../insurance/insuranceRules";
import type { EquipmentDto } from "@platform/api/legacy/legacyApi";
import { businessOf, equipmentModeOf, hasEquipment, hasFinancing, isAutoInsurance } from "../model/business";
import { customerOf, interventionRole, isCompany, type CredOperDraft } from "../model/credOperDraft";
import { isAdult, notAfterToday, notBeforeToday } from "./dateRules";
import { addError as add, checkRequired, fieldRule, type FieldErrors } from "./fieldRules";
import type { LocalDate } from "./localDate";

// Per-step validation: server field rules (required / visible) + date rules vs today.
// Error keys are field paths; the step components look up their field's key.

export function validateBusiness(op: CredOperDraft, _today: LocalDate): FieldErrors {
  return businessOf(op) ? {} : { aplBusinessId: "Choose the type of business." };
}

export function validateCompany(op: CredOperDraft, _today: LocalDate): FieldErrors {
  return op.aplCompanyId ? {} : { aplCompanyId: "Choose the company." };
}

const notNegative = (value: number | null | undefined, label: string) =>
  value != null && value < 0 ? `${label} can't be negative.` : null;

/** The vehicle fields (shared EquipmentDetail) of asset `index`: server rules + registration date not in the future. */
function checkVehicle(errors: FieldErrors, equipment: EquipmentDto, index: number, today: LocalDate) {
  const meta = equipment.metadataResponse;
  const prefix = `assets.${index}.equipment.`;
  for (const field of ["equipmentTypeId", "equipmentCategoryId", "equipmentStateId", "licencePlate", "registrationDate", "description"] as const) {
    checkRequired(errors, meta, field, `${prefix}${field}`, equipment[field]);
  }
  if (fieldRule(meta, "registrationDate").visible) {
    add(errors, `${prefix}registrationDate`, notAfterToday(equipment.registrationDate, today, "Registration date"));
  }
}

/** Financing only: vehicles are checked in the equipment step; Auto insurance has no financing. */
export function validateFinancial(op: CredOperDraft, _today: LocalDate): FieldErrors {
  const errors: FieldErrors = {};
  if (!hasFinancing(op)) return errors;
  const meta = op.metadataResponse;
  const equipment = op.assets?.[0]?.equipment;
  const equipmentMeta = equipment?.metadataResponse;
  const prefix = "assets.0.equipment.";

  if (equipment) {
    // Renting: each vehicle has its own amount (equipment step); the initial entry is the contract's
    if (equipmentModeOf(op) !== "multiple") {
      checkRequired(errors, equipmentMeta, "netAmount", `${prefix}netAmount`, equipment.netAmount);
    }
    checkRequired(errors, equipmentMeta, "retakeAmount", `${prefix}retakeAmount`, equipment.retakeAmount);
    checkRequired(errors, equipmentMeta, "retakePercentage", `${prefix}retakePercentage`, equipment.retakePercentage);
  }

  checkRequired(errors, meta, "credOperClassification", "credOperClassification", op.credOperClassification);
  checkRequired(errors, meta, "financialProduct", "financialProduct", op.financialProduct);
  checkRequired(errors, meta, "amount", "amount", op.amount);

  const condition = op.conditions?.[0];
  if (condition) {
    checkRequired(errors, condition.metadataResponse, "term", "conditions.0.term", condition.term);
  }
  return errors;
}

/**
 * Every business with equipment (quotation and proposal): each vehicle's fields, its details
 * (brand → version, km, engine size, doors) and, for renting, its own amount.
 */
export function validateEquipment(op: CredOperDraft, today: LocalDate): FieldErrors {
  const errors: FieldErrors = {};
  if (!hasEquipment(op)) return errors;
  const renting = equipmentModeOf(op) === "multiple";

  (op.assets ?? []).forEach((asset, index) => {
    const equipment = asset.equipment;
    if (!equipment) return;
    const meta = equipment.metadataResponse;
    const prefix = `assets.${index}.equipment.`;

    checkVehicle(errors, equipment, index, today);
    for (const field of ["brand", "model", "version", "odometer", "enginesize", "doors"] as const) {
      checkRequired(errors, meta, field, `${prefix}${field}`, equipment[field]);
    }
    if (renting) checkRequired(errors, meta, "netAmount", `${prefix}netAmount`, equipment.netAmount);
    add(errors, `${prefix}odometer`, notNegative(equipment.odometer, "Km"));
    add(errors, `${prefix}enginesize`, notNegative(equipment.enginesize, "Engine size"));
    add(
      errors,
      `${prefix}doors`,
      notNegative(equipment.doors, "Doors") ??
        (equipment.doors != null && !Number.isInteger(equipment.doors) ? "Doors must be a whole number." : null),
    );
  });
  return errors;
}

export function validateInterventions(op: CredOperDraft, today: LocalDate): FieldErrors {
  const errors: FieldErrors = {};
  const companyCustomer = isCompany(customerOf(op));
  let secondHolders = 0;

  op.interventions?.forEach((intervention) => {
    const prefix = `interventions.${intervention.correlationID}.`;
    // Second holder: only for a person first holder, and only one
    if (interventionRole(intervention) === "secondHolder") {
      secondHolders += 1;
      if (companyCustomer) errors[`${prefix}role`] = "A company can't have a second holder.";
      else if (secondHolders > 1) errors[`${prefix}role`] = "Only one second holder is allowed.";
    }

    // The intervention name is edited as the entity full name (Details form)
    checkRequired(errors, intervention.entity?.metadataResponse, "fullName", `${prefix}entity.fullName`, intervention.entity?.fullName);

    const person = intervention.person;
    const personMeta = person?.metadataResponse;

    if (person) {
      checkRequired(errors, personMeta, "birthDate", `${prefix}person.birthDate`, person.birthDate);
      if (fieldRule(personMeta, "birthDate").visible) {
        add(errors, `${prefix}person.birthDate`, isAdult(person.birthDate, today));
      }
    }

    const doc = intervention.entity?.legalDocs?.[0];
    if (doc) {
      const docPrefix = `${prefix}entity.legalDocs.0.`;
      checkRequired(errors, doc.metadataResponse, "legalDocNumber", `${docPrefix}legalDocNumber`, doc.legalDocNumber);
      checkRequired(errors, doc.metadataResponse, "validDate", `${docPrefix}validDate`, doc.validDate);
      if (fieldRule(doc.metadataResponse, "validDate").visible) {
        add(errors, `${docPrefix}validDate`, notBeforeToday(doc.validDate, today, "Identification document"));
      }
    }
  });

  return errors;
}

/** Insurances step: see insurance/insuranceRules.ts. */
export function validateInsurancesStep(op: CredOperDraft, today: LocalDate): FieldErrors {
  const errors = validateInsurances(op, today);
  // Auto insurance: the insurance is the product
  if (isAutoInsurance(op) && !op.insurances.some((i) => i.kind === "car")) {
    errors["insurances.required"] = "Add the vehicle's insurance.";
  }
  return errors;
}

export const firstErrorKey = (errors: FieldErrors): string | undefined => Object.keys(errors)[0];
