import { describe, expect, it } from "vitest";
import { AUTO_INSURANCE_BUSINESS_ID } from "../model/business";
import type { CredOperDraft } from "../model/credOperDraft";
import { validateCustomer } from "../customer/customerRules";
import {
  firstErrorKey,
  validateBusiness,
  validateEquipment,
  validateFinancial,
  validateInsurancesStep,
  validateInterventions,
} from "./stepValidation";

const today = "2026-10-05";
const required = (jsonName: string, isVisible = true) => ({ jsonName, isRequired: true, isVisible, isReadOnly: false });

const validOperation = (): CredOperDraft => ({
  customerName: "Ana Silva",
  metadataResponse: [required("customerName")],
  assets: [{ correlationID: "a1", equipment: { registrationDate: "2024-01-10", metadataResponse: [required("registrationDate")] } }],
  interventions: [
    {
      correlationID: "c1",
      credOperIntervType: 1,
      person: { birthDate: "1990-05-01" },
      entity: { legalDocs: [{ legalDocNumber: "123", validDate: "2030-01-01" }] },
    },
  ],
  insurances: [],
});

describe("step validation", () => {
  it("a valid operation has no errors", () => {
    const op = validOperation();
    expect({ ...validateCustomer(op, today), ...validateFinancial(op, today), ...validateInterventions(op, today) }).toEqual({});
  });

  it("registration date in the future (equipment step)", () => {
    const op = { ...validOperation(), aplBusinessId: 4 };
    op.assets![0].equipment!.registrationDate = "2026-10-06";
    expect(validateEquipment(op, today)).toEqual({
      "assets.0.equipment.registrationDate": "Registration date can't be in the future.",
    });
  });

  it("guarantor aged 17", () => {
    const op = validOperation();
    op.interventions!.push({ correlationID: "g1", credOperIntervType: 4, person: { birthDate: "2009-01-01" } });
    expect(validateInterventions(op, today)["interventions.g1.person.birthDate"]).toBe("Must be at least 18 years old.");
  });

  it("expired identification document", () => {
    const op = validOperation();
    op.interventions![0].entity!.legalDocs![0].validDate = "2026-10-04";
    expect(validateInterventions(op, today)["interventions.c1.entity.legalDocs.0.validDate"]).toBe(
      "Identification document has expired.",
    );
  });

  it("required equipment amount and initial entry (server rules on every field)", () => {
    const op = validOperation();
    op.assets![0].equipment!.metadataResponse = [required("netAmount"), required("retakeAmount"), required("retakePercentage")];
    expect(Object.keys(validateFinancial(op, today))).toEqual([
      "assets.0.equipment.netAmount",
      "assets.0.equipment.retakeAmount",
      "assets.0.equipment.retakePercentage",
    ]);
  });

  it("required intervention name is the entity full name", () => {
    const op = validOperation();
    op.interventions![0].entity!.metadataResponse = [required("fullName")];
    expect(validateInterventions(op, today)["interventions.c1.entity.fullName"]).toBe("This field is required.");
  });

  it("firstErrorKey", () => {
    expect(firstErrorKey({})).toBeUndefined();
    expect(firstErrorKey({ b: "x", a: "y" })).toBe("b");
  });
});

describe("second holder rules", () => {
  const customer = (entityTypeId: number) => ({ correlationID: "c1", credOperIntervType: 1, entity: { entityTypeId } });
  const second = (ref: string) => ({ correlationID: ref, credOperIntervType: 2 });

  it("a second holder is not allowed when the first holder is a company", () =>
    expect(validateInterventions({ insurances: [], interventions: [customer(2), second("s1")] }, today)["interventions.s1.role"]).toBe(
      "A company can't have a second holder.",
    ));

  it("only one second holder: the extra one is flagged", () => {
    const errors = validateInterventions({ insurances: [], interventions: [customer(1), second("s1"), second("s2")] }, today);
    expect(errors["interventions.s1.role"]).toBeUndefined();
    expect(errors["interventions.s2.role"]).toBe("Only one second holder is allowed.");
  });

  it("one second holder with a person customer is fine", () =>
    expect(validateInterventions({ insurances: [], interventions: [customer(1), second("s1")] }, today)).toEqual({}));
});

describe("business", () => {
  it("must be chosen", () => {
    expect(validateBusiness({ insurances: [] }, today)).toEqual({ aplBusinessId: "Choose the type of business." });
    expect(validateBusiness({ insurances: [], aplBusinessId: 2 }, today)).toEqual({});
  });
});

describe("vehicles by business", () => {
  const req = (jsonName: string) => ({ jsonName, isRequired: true, isVisible: true, isReadOnly: false });
  const meta = [req("equipmentTypeId"), req("brand"), req("netAmount")];
  const vehicle = (equipment: Record<string, unknown> = {}) => ({ equipment: { metadataResponse: meta, ...equipment } });
  const op = (aplBusinessId: number, assets = [vehicle({ registrationDate: "2027-01-01" })], credOperStep = 1): CredOperDraft => ({
    insurances: [],
    credOperStep,
    aplBusinessId,
    assets,
  });

  it("every business with equipment checks the vehicle in the equipment step, quotation too", () => {
    for (const business of [4, 1, AUTO_INSURANCE_BUSINESS_ID]) {
      const errors = validateEquipment(op(business), today);
      expect(errors["assets.0.equipment.equipmentTypeId"]).toBe("This field is required.");
      expect(errors["assets.0.equipment.brand"]).toBe("This field is required.");
      expect(errors["assets.0.equipment.registrationDate"]).toBe("Registration date can't be in the future.");
    }
  });

  it("financial data no longer checks the vehicle", () =>
    expect(validateFinancial(op(4), today)["assets.0.equipment.equipmentTypeId"]).toBeUndefined());

  it("renting: every vehicle, each with its own amount", () => {
    const errors = validateEquipment(op(13, [vehicle({ equipmentTypeId: 1, brand: "B", netAmount: 1 }), vehicle()]), today);
    expect(errors["assets.0.equipment.netAmount"]).toBeUndefined();
    expect(errors["assets.1.equipment.brand"]).toBe("This field is required.");
    expect(errors["assets.1.equipment.netAmount"]).toBe("This field is required.");
    // the amount is per vehicle, so Financial data doesn't ask for it
    expect(validateFinancial(op(13, [vehicle()]), today)["assets.0.equipment.netAmount"]).toBeUndefined();
  });

  it("single vehicle: the amount stays in Financial data", () =>
    expect(validateFinancial(op(4, [vehicle()]), today)["assets.0.equipment.netAmount"]).toBe("This field is required."));

  it("personal loan: no vehicle checks", () => expect(validateEquipment(op(2), today)).toEqual({}));

  it("auto insurance: no financing to check", () =>
    expect(validateFinancial({ ...op(AUTO_INSURANCE_BUSINESS_ID), metadataResponse: [req("financialProduct")] }, today)).toEqual({}));
});

describe("auto insurance needs its insurance", () => {
  it("at least one car insurance", () => {
    const o: CredOperDraft = { insurances: [], aplBusinessId: AUTO_INSURANCE_BUSINESS_ID, credOperStep: 1 };
    expect(validateInsurancesStep(o, today)["insurances.required"]).toBe("Add the vehicle's insurance.");
    expect(validateInsurancesStep({ ...o, aplBusinessId: 4 }, today)["insurances.required"]).toBeUndefined();
  });
});
