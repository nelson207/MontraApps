import { describe, expect, it } from "vitest";
import { AUTO_INSURANCE_BUSINESS_ID, EQUIPMENT_ASSET } from "../model/business";
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
      entity: { id: "e1", documents: [{ legalDocTypeId: 1, legalDocNumber: "123", validDate: "2030-01-01" }] },
    },
  ],
  insurances: [],
});

describe("step validation", () => {
  it("a valid operation has no errors", () => {
    const op = validOperation();
    expect({ ...validateCustomer(op, today), ...validateFinancial(op, today), ...validateInterventions(op, today) }).toEqual({});
  });

  it("a year that isn't real (equipment step)", () => {
    const op = { ...validOperation(), aplBusinessId: 4, assetTypeId: EQUIPMENT_ASSET };
    Object.assign(op.assets![0].equipment!, { equipYear: 1500, equipmentTypeId: 1, equipmentCategoryId: 1, equipmentStateId: 0 });
    expect(validateEquipment(op, today)).toEqual({
      "assets.0.equipment.equipYear": "Enter a valid year.",
    });
  });

  it("a new proposal can't go on without its customer; a saved one is as the API has it", () => {
    const noCustomer = { ...validOperation(), interventions: [] };
    expect(validateInterventions(noCustomer, today)["interventions.customer"]).toContain("customer is missing");
    expect(validateInterventions({ ...noCustomer, id: "AP1" }, today)).toEqual({});
  });

  it("a company has no birth date to check", () => {
    const op = validOperation();
    op.interventions![0] = {
      correlationID: "c1",
      credOperIntervType: 1,
      entity: { id: "e1", entityTypeId: 2 },
      person: { birthDate: "2020-01-01" },
    };
    expect(validateInterventions(op, today)).toEqual({});
  });

  it("guarantor aged 17", () => {
    const op = validOperation();
    op.interventions!.push({ correlationID: "g1", credOperIntervType: 4, person: { birthDate: "2009-01-01" } });
    expect(validateInterventions(op, today)["interventions.g1.person.birthDate"]).toBe("Must be at least 18 years old.");
  });

  it("expired identification document", () => {
    const op = validOperation();
    op.interventions![0].entity!.documents![0].validDate = "2026-10-04";
    expect(validateInterventions(op, today)["interventions.c1.entity.documents.0.validDate"]).toBe(
      "Identification document has expired.",
    );
  });

  it("the entity's own documents can't be changed here: not validated", () => {
    const op = validOperation();
    op.interventions![0].entity!.documents!.push({ id: "d1", legalDocTypeId: 1, validDate: "2026-10-04" });
    expect(validateInterventions(op, today)).toEqual({});
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

  it("a new company needs its name, legal form and addresses; its activity once the legal form has one", () => {
    const op = validOperation();
    op.interventions![0] = { correlationID: "c1", credOperIntervType: 1, entity: { entityTypeId: 2 } };
    expect(Object.keys(validateInterventions(op, today))).toEqual([
      "interventions.c1.entity.vatNumber",
      "interventions.c1.entity.fullName",
      "interventions.c1.entity.juridicalTypeId",
      "interventions.c1.entity.phone",
      "interventions.c1.fiscalAddress.street",
      "interventions.c1.fiscalAddress.postalCode",
      "interventions.c1.fiscalAddress.countryId",
    ]);
    op.interventions![0].entity = { entityTypeId: 2, juridicalTypeId: 1, juridicalType: { id: 1, hasActivity: true, activityTypeContextId: 9 } };
    expect(validateInterventions(op, today)["interventions.c1.company.leafActivityTypeId"]).toBe("This field is required.");
  });

  it("a new person: names, one phone at least, and both addresses when they differ", () => {
    const op = validOperation();
    op.interventions![0] = { correlationID: "c1", credOperIntervType: 1, entity: {}, samePostalAddress: false };
    const keys = Object.keys(validateInterventions(op, today));
    expect(keys).toEqual(expect.arrayContaining(["interventions.c1.person.firstName", "interventions.c1.person.lastName", "interventions.c1.postalAddress.street"]));
    expect(keys).not.toContain("interventions.c1.entity.juridicalTypeId");
    expect(validateInterventions(op, today)["interventions.c1.entity.phone"]).toBe("Enter a mobile or a landline phone.");
    op.interventions![0].entityLandlinePhone = { phoneNumber: "212345678" };
    expect(validateInterventions(op, today)["interventions.c1.entity.phone"]).toBeUndefined();
  });

  it("an entity that exists: its missing data isn't asked for", () => {
    const op = validOperation();
    op.interventions![0] = { correlationID: "c1", credOperIntervType: 1, entity: { id: "e1" } };
    expect(validateInterventions(op, today)).toEqual({});
  });

  it("an e-mail typed must be valid; one on file is the entity's", () => {
    const op = validOperation();
    op.interventions![0].entityEmail = { email: "not-an-email" };
    expect(validateInterventions(op, today)["interventions.c1.entityEmail.email"]).toBe("Enter a valid e-mail address.");
    op.interventions![0].entityEmail = { id: "M1", email: "not-an-email" };
    expect(validateInterventions(op, today)).toEqual({});
  });

  it("an entity that exists, asked to use a new phone: one must be typed", () => {
    const op = validOperation();
    op.interventions![0].entityMobilePhone = { phoneNumber: "" };
    expect(validateInterventions(op, today)["interventions.c1.entity.phone"]).toBe("Enter a mobile or a landline phone.");
  });

  it("a document added here needs its type", () => {
    const op = validOperation();
    op.interventions![0].entity!.documents!.push({ legalDocNumber: "X" });
    expect(validateInterventions(op, today)["interventions.c1.entity.documents.1.legalDocTypeId"]).toBe("This field is required.");
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
    expect(Object.keys(validateInterventions({ insurances: [], interventions: [customer(1), second("s1")] }, today)).filter((key) => key.endsWith(".role"))).toEqual([]));
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
    assetTypeId: aplBusinessId === 2 ? null : EQUIPMENT_ASSET,
    assets,
  });

  it("every business with equipment checks the vehicle in the equipment step, quotation too", () => {
    for (const business of [4, 1, AUTO_INSURANCE_BUSINESS_ID]) {
      const errors = validateEquipment(op(business), today);
      expect(errors["assets.0.equipment.equipmentTypeId"]).toBe("This field is required.");
    }
  });

  const vehicleErrors = (credOperStep: number, metadataResponse: ReturnType<typeof req>[] = []) =>
    Object.keys(validateEquipment(op(4, [{ equipment: { metadataResponse } }], credOperStep), today)).map((key) => key.replace("assets.0.equipment.", ""));

  it("a quotation requires type, category, state and year, whatever the server says about brand, model and version", () =>
    expect(vehicleErrors(1, [req("brand"), req("model"), req("version")]).sort()).toEqual(["equipYear", "equipmentCategoryId", "equipmentStateId", "equipmentTypeId"]));

  it("a proposal also requires brand, model and version, even with no server rules", () =>
    expect(vehicleErrors(2).sort()).toEqual(["brand", "equipYear", "equipmentCategoryId", "equipmentStateId", "equipmentTypeId", "model", "version"]));

  describe("the year and the month", () => {
    const COMPLETE = { metadataResponse: [], equipmentTypeId: 1, equipmentCategoryId: 1, brand: "B", model: "M", version: "V" };
    const errorsOf = (credOperStep: number, equipment: Record<string, unknown>) =>
      Object.keys(validateEquipment(op(4, [{ equipment: { ...COMPLETE, ...equipment } }], credOperStep), today)).map((key) => key.replace("assets.0.equipment.", ""));

    describe.each([[1, "quotation"], [2, "proposal"]])("step %i (%s)", (step) => {
      it("new: the year is required, the month isn't", () => {
        expect(errorsOf(step, { equipmentStateId: 0 })).toEqual(["equipYear"]);
        expect(errorsOf(step, { equipmentStateId: 0, equipYear: 2026 })).toEqual([]);
      });

      it.each([1, 3])("used (state %i): both are required", (equipmentStateId) => {
        expect(errorsOf(step, { equipmentStateId }).sort()).toEqual(["equipMonth", "equipYear"]);
        expect(errorsOf(step, { equipmentStateId, equipYear: 2022 })).toEqual(["equipMonth"]);
        expect(errorsOf(step, { equipmentStateId, equipYear: 2022, equipMonth: 3 })).toEqual([]);
      });
    });

    it("a quotation still doesn't require brand, model or version, even if the server's rule says so", () =>
      expect(validateEquipment(op(4, [vehicle({ equipmentTypeId: 1, equipmentCategoryId: 1, equipmentStateId: 0, equipYear: 2026 })], 1), today)).toEqual({}));

    it("a quotation still refuses values that aren't real", () =>
      expect(errorsOf(1, { equipmentStateId: 1, equipYear: 1500, equipMonth: 13 }).sort()).toEqual(["equipMonth", "equipYear"]));

    it("the registration date is no longer asked for, whatever the server says", () =>
      expect(Object.keys(validateEquipment(op(4, [{ equipment: { metadataResponse: [req("registrationDate")] } }], 1), today))).not.toContain("assets.0.equipment.registrationDate"));
  });

  it("the other fields stay the server's, and a field it hides is never required", () => {
    expect(vehicleErrors(1, [req("licencePlate")])).toContain("licencePlate");
    expect(vehicleErrors(2, [{ ...req("version"), isVisible: false }])).not.toContain("version");
  });

  it("financial data no longer checks the vehicle", () =>
    expect(validateFinancial(op(4), today)["assets.0.equipment.equipmentTypeId"]).toBeUndefined());

  it("renting: every vehicle, each with its own amount", () => {
    const errors = validateEquipment(op(13, [vehicle({ equipmentTypeId: 1, brand: "B", netAmount: 1 }), vehicle()], 2), today);
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

describe("initial entry: not more than what it is a share of", () => {
  const withEntry = (netAmount: number, retakeAmount: number) => {
    const op = validOperation();
    op.assets![0].equipment = { ...op.assets![0].equipment, netAmount, retakeAmount };
    return op;
  };

  it("higher than the loan amount", () =>
    expect(validateFinancial(withEntry(20_000, 20_000.01), today)["assets.0.equipment.retakeAmount"]).toBe(
      "Initial entry amount can't be higher than the loan amount.",
    ));

  it("up to the whole amount is fine", () =>
    expect(validateFinancial(withEntry(20_000, 20_000), today)).toEqual({}));
});
