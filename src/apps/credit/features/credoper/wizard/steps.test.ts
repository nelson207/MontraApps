import { describe, expect, it } from "vitest";
import { AUTO_INSURANCE_BUSINESS_ID } from "../model/business";
import type { CredOperDraft } from "../model/credOperDraft";
import { interventionTabOfErrorKey, issuesByStep, stepsFor, validateStages } from "./steps";

const today = "2026-10-05";

const op = (aplBusinessId: number | undefined, credOperStep = 1, extra: Partial<CredOperDraft> = {}): CredOperDraft => ({
  insurances: [],
  aplBusinessId,
  credOperStep,
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
  const converted = (business?: number) => ({ ...op(business, 2), quotationId: 41 }) as CredOperDraft;

  it("step 1 is the read-only quotation, and the business can't change", () =>
    expect(ids("proposal", converted(4))).toEqual(["quotation", "equipment", "financial", "interventions", "insurances", "summary"]));

  it("the quotation step has nothing to fix", () =>
    expect(stepsFor("proposal", converted(4))[0].validate({ ...converted(4), customerName: "" }, today)).toEqual({}));
});

describe("validateStages", () => {
  it("reports the first step with errors, and errors per step", () => {
    const o = op(4, 1, { customerName: "Ana", assets: [{ correlationID: "a1", equipment: { registrationDate: "2026-10-06" } }] });
    const result = validateStages(stepsFor("quotation", o), o, today);
    expect(result.firstInvalidStep).toBe("equipment");
    expect(result.byStep.equipment?.["assets.0.equipment.registrationDate"]).toBeDefined();
    expect(result.errors["assets.0.equipment.registrationDate"]).toBeDefined();
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
    expect(interventionTabOfErrorKey("interventions.c1.entity.legalDocs.0.validDate")).toBe(3);
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
    const converted = op(4, 2, { quotationId: "tok-q" } as Partial<CredOperDraft>);
    expect(stepsFor("proposal", converted, { chooseCompany: true }).map((s) => s.id)).not.toContain("company");
  });

  it("needs a company", () => {
    const company = stepsFor("quotation", op(4), { chooseCompany: true })[1];
    expect(company.validate(op(4), today)).toEqual({ aplCompanyId: "Choose the company." });
    expect(company.validate(op(4, 1, { aplCompanyId: 2 }), today)).toEqual({});
  });
});
