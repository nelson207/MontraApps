import { isValidVehicleMonth, isValidVehicleYear } from "@platform/features/equipment/equipmentModel";
import { validateInsurances } from "../insurance/insuranceRules";
import type { EquipmentDto } from "@platform/api/legacy/legacyApi";
import {
  amountLabel,
  assetTypeOf,
  buildingOf,
  businessOf,
  equipmentModeOf,
  hasBuilding,
  hasEquipment,
  hasFinancing,
  isAutoInsurance,
  retakeBaseOf,
} from "../model/business";
import { EMAIL_PATTERN } from "../customer/customerRules";
import { isValidNif, vatOf } from "../entityLookup/entityLookup";
import { CUSTOMER_NEEDED, customerOf, hasCustomer, interventionRole, isCompany, isExistingEntity, stageOf, type CredOperDraft } from "../model/credOperDraft";
import { missingRequired } from "../model/interventionRequired";
import { isAdult, notAfterToday, notBeforeToday } from "./dateRules";
import { addError as add, checkRequired, fieldRule, REQUIRED_MESSAGE, requiredError, vehicleFieldRule, type FieldErrors } from "./fieldRules";
import type { LocalDate } from "./localDate";

const PHONE_NEEDED = "Enter a mobile or a landline phone.";

// Per-step validation: server field rules (required / visible) + date rules vs today.
// Error keys are field paths; the step components look up their field's key.

export function validateBusiness(op: CredOperDraft, _today: LocalDate): FieldErrors {
  return businessOf(op) ? {} : { aplBusinessId: "Choose the type of business." };
}

export function validateCompany(op: CredOperDraft, _today: LocalDate): FieldErrors {
  return op.aplCompanyId ? {} : { aplCompanyId: "Choose the company." };
}

export function validateAssetType(op: CredOperDraft, _today: LocalDate): FieldErrors {
  return assetTypeOf(op) !== undefined ? {} : { assetTypeId: "Choose what is financed." };
}

/** The building (asset type 2): amounts not negative, built and bought by today */
export function validateBuilding(op: CredOperDraft, today: LocalDate): FieldErrors {
  const errors: FieldErrors = {};
  if (!hasBuilding(op)) return errors;
  const building = buildingOf(op.assets?.[0]) ?? {};
  const prefix = "assets.0.building.";
  add(errors, `${prefix}purchaseAmount`, notNegative(building.purchaseAmount, "Purchase amount"));
  add(errors, `${prefix}purchaseDate`, notAfterToday(building.purchaseDate, today, "Purchase date"));
  if (building.buildingYear != null && building.buildingYear > Number(today.slice(0, 4))) {
    add(errors, `${prefix}buildingYear`, "Building year can't be in the future.");
  }
  return errors;
}

const notNegative = (value: number | null | undefined, label: string) =>
  value != null && value < 0 ? `${label} can't be negative.` : null;

/** The vehicle fields (shared EquipmentDetail) of asset `index`: their rules + a real year and month. */
function checkVehicle(errors: FieldErrors, stage: "quotation" | "proposal", equipment: EquipmentDto, index: number, today: LocalDate) {
  const meta = equipment.metadataResponse;
  const prefix = `assets.${index}.equipment.`;
  const stateId = equipment.equipmentStateId;
  for (const field of ["equipmentTypeId", "equipmentCategoryId", "equipmentStateId", "licencePlate", "equipYear", "equipMonth", "description"] as const) {
    add(errors, `${prefix}${field}`, requiredError(vehicleFieldRule(stage, meta, field, stateId), equipment[field]));
  }
  const { equipYear: year, equipMonth: month } = equipment;
  if (year != null && !isValidVehicleYear(year, today)) add(errors, `${prefix}equipYear`, "Enter a valid year.");
  if (month != null && !isValidVehicleMonth(month)) add(errors, `${prefix}equipMonth`, "Enter a month from 1 to 12.");
}

/** The initial entry is more than what it is a share of (shown as typed, not only after Next) */
export function retakeOverBase(op: CredOperDraft): string | null {
  const amount = op.assets?.[0]?.equipment?.retakeAmount;
  const base = retakeBaseOf(op);
  if (amount == null || base == null || amount <= base) return null;
  const of = equipmentModeOf(op) === "multiple" ? "the total of the vehicles" : `the ${amountLabel(op).toLowerCase()}`;
  return `Initial entry amount can't be higher than ${of}.`;
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
    add(errors, `${prefix}retakeAmount`, retakeOverBase(op));
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

    const stage = stageOf(op);
    checkVehicle(errors, stage, equipment, index, today);
    for (const field of ["brand", "model", "version", "odometer", "enginesize", "doors"] as const) {
      add(errors, `${prefix}${field}`, requiredError(vehicleFieldRule(stage, meta, field, equipment.equipmentStateId), equipment[field]));
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
  // A new proposal's customer waits for its classification: it can't go on without one
  if (!op.id && !hasCustomer(op)) errors["interventions.customer"] = CUSTOMER_NEEDED;

  op.interventions?.forEach((intervention) => {
    const prefix = `interventions.${intervention.correlationID}.`;
    // Second holder: only for a person first holder, and only one
    if (interventionRole(intervention) === "secondHolder") {
      secondHolders += 1;
      if (companyCustomer) errors[`${prefix}role`] = "A company can't have a second holder.";
      else if (secondHolders > 1) errors[`${prefix}role`] = "Only one second holder is allowed.";
    }

    for (const { key } of missingRequired(intervention)) add(errors, key, key.endsWith("entity.phone") ? PHONE_NEEDED : REQUIRED_MESSAGE);

    const nif = vatOf(intervention);
    if (!isExistingEntity(intervention) && nif && !isValidNif(nif)) add(errors, `${prefix}entity.vatNumber`, "Enter a valid NIF (9 digits).");

    // Typed here, like the Customer step's; one on file is the entity's
    const email = intervention.entityEmail;
    if (!email?.id && email?.email?.trim() && !EMAIL_PATTERN.test(email.email.trim())) add(errors, `${prefix}entityEmail.email`, "Enter a valid e-mail address.");

    const person = intervention.person;
    const personMeta = person?.metadataResponse;

    if (person && !isCompany(intervention)) {
      checkRequired(errors, personMeta, "birthDate", `${prefix}person.birthDate`, person.birthDate);
      if (fieldRule(personMeta, "birthDate").visible) {
        add(errors, `${prefix}person.birthDate`, isAdult(person.birthDate, today));
      }
    }

    // Only those added here: the entity's own can't be changed from here
    intervention.entity?.documents?.forEach((doc, documentIndex) => {
      if (doc.id) return;
      add(errors, `${prefix}entity.documents.${documentIndex}.validDate`, notBeforeToday(doc.validDate, today, "Identification document"));
    });
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
