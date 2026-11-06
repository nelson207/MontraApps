import { describe, expect, it } from "vitest";
import { AUTO_INSURANCE_BUSINESS_ID, BUILDING_ASSET, EQUIPMENT_ASSET } from "../model/business";
import type { CredOperDraft } from "../model/credOperDraft";
import { interventionTabOfErrorKey, issuesByStep, stepsFor, validateStages } from "./steps";

const today = "2026-10-05";

// The asset type each business had before asset types were configured: personal loan none, the others equipment
const op = (aplBusinessId: number | undefined, credOperStep = 1, extra: Partial<CredOperDraft> = {}): CredOperDraft => ({
  insurances: [],
  aplBusinessId,
  credOperStep,
  assetTypeId: aplBusinessId === 2 ? null : EQUIPMENT_ASSET,
  ...extra,
});
const ids = (stage: "quotation" | "proposal", o: CredOperDraft, chooseBusiness = true) =>
  stepsFor(stage, o, { chooseBusiness }).map((s) => s.id);

describe("steps by business", () => {
  it("no business yet: only the Business step", () => {
    expect(ids("quotation", op(undefined))).toEqual(["business"]);
    expect(ids("proposal", op(undefined, 2))).toEqual(["business"]);
  });

  it("with equipment: Equipment detail right after Customer (quotation and proposal)", () => {
    for (const business of [4, 1, 13]) {
      expect(ids("quotation", op(business))).toEqual(["business", "customer", "equipment", "financial", "summary"]);
      expect(ids("proposal", op(business, 2))).toEqual([
        "business",
        "customer",
        "equipment",
        "financial",
        "interventions",
        "insurances",
        "summary",
      ]);
    }
  });

  it("personal loan: no equipment step", () => {
    expect(ids("quotation", op(2))).toEqual(["business", "customer", "financial", "summary"]);
    expect(ids("proposal", op(2, 2))).toEqual(["business", "customer", "financial", "interventions", "insurances", "summary"]);
  });

  it("auto insurance: vehicle and insurance, no financing", () => {
    expect(ids("quotation", op(AUTO_INSURANCE_BUSINESS_ID))).toEqual(["business", "customer", "equipment", "insurances", "summary"]);
    expect(ids("proposal", op(AUTO_INSURANCE_BUSINESS_ID, 2))).toEqual([
      "business",
      "customer",
      "equipment",
      "interventions",
      "insurances",
      "summary",
    ]);
  });

  it("only one business available: no Business step", () =>
    expect(ids("quotation", op(4), false)).toEqual(["customer", "equipment", "financial", "summary"]));

  it("labels follow the business", () => {
    const label = (o: CredOperDraft, id: string) => stepsFor("proposal", o).find((s) => s.id === id)?.label;
    expect(label(op(13, 2), "equipment")).toBe("Vehicles");
    expect(label(op(4, 2), "equipment")).toBe("Equipment detail");
    expect(label(op(AUTO_INSURANCE_BUSINESS_ID, 2), "equipment")).toBe("Vehicle");
    expect(label(op(AUTO_INSURANCE_BUSINESS_ID, 2), "insurances")).toBe("Insurance");
  });
});

describe("proposal converted from a quotation", () => {
  const converted = (business?: number) => op(business, 2, { sourceCredOperId: "AQquote" });

  it("first its own Quotation step; no Business, Company or Asset type step (they're the quotation's); the customer as usual", () => {
    const steps = stepsFor("proposal", converted(4), { chooseCompany: true, chooseAssetType: true }).map((s) => s.id);
    expect(steps).toEqual(["quotation", "customer", "equipment", "financial", "interventions", "insurances", "summary"]);
  });

  it("the Quotation step is read-only: nothing to fix there", () =>
    expect(stepsFor("proposal", converted(4))[0].validate(converted(4), today)).toEqual({}));

  it("reopened after its first save: still the same steps", () =>
    expect(ids("proposal", { ...converted(4), id: "APtoken", rowVersion: "rv-1" })).toEqual(ids("proposal", converted(4))));

  it("a proposal not made from a quotation chooses them as usual, and has no Quotation step", () => {
    expect(ids("proposal", op(4, 2))[0]).toBe("business");
    expect(ids("proposal", op(4, 2))).not.toContain("quotation");
  });
});

describe("validateStages", () => {
  it("reports the first step with errors, and errors per step", () => {
    const o = op(4, 1, { customerName: "Ana", assets: [{ correlationID: "a1", equipment: { equipYear: 1500 } }] });
    const result = validateStages(stepsFor("quotation", o), o, today);
    expect(result.firstInvalidStep).toBe("equipment");
    expect(result.byStep.equipment?.["assets.0.equipment.equipYear"]).toBeDefined();
    expect(result.errors["assets.0.equipment.equipYear"]).toBeDefined();
  });

  it("no business: the Business step is invalid", () =>
    expect(validateStages(stepsFor("quotation", op(undefined)), op(undefined), today).firstInvalidStep).toBe("business"));
});

describe("issuesByStep", () => {
  it("groups each step's errors, in step order", () => {
    const steps = stepsFor("proposal", op(4, 2));
    const groups = issuesByStep(steps, {
      customer: { customerName: "This field is required." },
      equipment: { "assets.0.equipment.brand": "This field is required." },
      insurances: { "insurances.x.link": "The insured person no longer exists." },
    });
    expect(groups.map((g) => [g.step.id, g.issues.length])).toEqual([
      ["customer", 1],
      ["equipment", 1],
      ["insurances", 1],
    ]);
    expect(groups[0].issues[0]).toEqual({ key: "customerName", message: "This field is required." });
  });

  it("is empty when there are no errors", () => expect(issuesByStep(stepsFor("quotation", op(2)), {})).toEqual([]));
});

describe("interventionTabOfErrorKey", () => {
  it("maps intervention errors to the person sub-tab that edits them", () => {
    expect(interventionTabOfErrorKey("interventions.c1.entity.fullName")).toBe(1);
    expect(interventionTabOfErrorKey("interventions.c1.entity.documents.0.validDate")).toBe(3);
    expect(interventionTabOfErrorKey("interventions.c1.fiscalAddress.street")).toBe(2);
    expect(interventionTabOfErrorKey("interventions.c1.person.firstName")).toBe(1);
    expect(interventionTabOfErrorKey("interventions.c1.company.leafActivityTypeId")).toBe(1);
    expect(interventionTabOfErrorKey("interventions.c1.entity.phone")).toBe(1);
    expect(interventionTabOfErrorKey("interventions.c1.person.birthDate")).toBe(4);
  });
});

describe("Company step", () => {
  it("only when the business can be done with several companies, right after Business", () => {
    expect(stepsFor("quotation", op(4), { chooseCompany: true }).map((s) => s.id)).toEqual([
      "business",
      "company",
      "customer",
      "equipment",
      "financial",
      "summary",
    ]);
    expect(stepsFor("quotation", op(4)).map((s) => s.id)).not.toContain("company");
  });

  it("first when the only business is chosen for the user; never on a converted proposal", () => {
    expect(stepsFor("quotation", op(2), { chooseBusiness: false, chooseCompany: true })[0].id).toBe("company");
    const converted = op(4, 2, { sourceCredOperId: "tok-q" });
    expect(stepsFor("proposal", converted, { chooseCompany: true }).map((s) => s.id)).not.toContain("company");
  });

  it("needs a company", () => {
    const company = stepsFor("quotation", op(4), { chooseCompany: true })[1];
    expect(company.validate(op(4), today)).toEqual({ aplCompanyId: "Choose the company." });
    expect(company.validate(op(4, 1, { aplCompanyId: 2 }), today)).toEqual({});
  });
});

describe("Asset type step, and the asset's detail", () => {
  const ids = (o: CredOperDraft, chooseAssetType = false) => stepsFor("quotation", o, { chooseCompany: true, chooseAssetType }).map((s) => s.id);

  it("only when the business offers several asset types in the company, right after Company", () => {
    expect(ids(op(4), true).slice(0, 4)).toEqual(["business", "company", "assetType", "customer"]);
    expect(ids(op(4))).not.toContain("assetType");
  });

  it("equipment: Equipment detail; building: Building detail; no asset: neither", () => {
    expect(ids(op(4, 1, { assetTypeId: EQUIPMENT_ASSET }))).toEqual(["business", "company", "customer", "equipment", "financial", "summary"]);
    expect(ids(op(4, 1, { assetTypeId: BUILDING_ASSET }))).toEqual(["business", "company", "customer", "building", "financial", "summary"]);
    expect(ids(op(4, 1, { assetTypeId: null }))).toEqual(["business", "company", "customer", "financial", "summary"]);
    // Not chosen yet: no detail either
    expect(ids(op(4, 1, { assetTypeId: undefined }), true)).toEqual(["business", "company", "assetType", "customer", "financial", "summary"]);
  });

  it("needs an asset type (no asset is one)", () => {
    const step = stepsFor("quotation", op(4), { chooseAssetType: true }).find((s) => s.id === "assetType")!;
    expect(step.validate(op(4, 1, { assetTypeId: undefined }), today)).toEqual({ assetTypeId: "Choose what is financed." });
    expect(step.validate(op(4, 1, { assetTypeId: null }), today)).toEqual({});
  });

  it("the building: amounts not negative, built and bought by today", () => {
    const building = (b: Record<string, unknown>) =>
      op(4, 1, { assetTypeId: BUILDING_ASSET, assets: [{ assetType: BUILDING_ASSET, building: b } as never] });
    const step = stepsFor("quotation", building({})).find((s) => s.id === "building")!;
    expect(step.validate(building({ purchaseAmount: -1, purchaseDate: "2026-10-06", buildingYear: 2027 }), today)).toEqual({
      "assets.0.building.purchaseAmount": "Purchase amount can't be negative.",
      "assets.0.building.purchaseDate": "Purchase date can't be in the future.",
      "assets.0.building.buildingYear": "Building year can't be in the future.",
    });
    expect(step.validate(building({ purchaseAmount: 1, purchaseDate: "2020-01-01", buildingYear: 1990 }), today)).toEqual({});
  });
});
