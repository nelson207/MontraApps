import { describe, expect, it } from "vitest";
import type { CarInsurance, CreditProtectionInsurance, CredOperDraft } from "../model/credOperDraft";
import { validateInsurancesStep } from "../validation/stepValidation";
import { isDuplicate, validateInsurance, validateInsurances } from "./insuranceRules";

const today = "2026-10-05";

const car = (changes: Partial<CarInsurance> = {}): CarInsurance => ({
  id: "car1",
  kind: "car",
  insuranceTypeId: 10,
  assetRef: "a1",
  driver: { licenseExpiryDate: "2030-01-01", mainDriverIsCustomer: true },
  protectionIds: [1],
  ...changes,
});

const protection = (id: string, changes: Partial<CreditProtectionInsurance> = {}): CreditProtectionInsurance => ({
  id,
  kind: "creditProtection",
  insuranceTypeId: 7,
  interventionRef: "c1",
  ...changes,
});

const operation = (insurances: CredOperDraft["insurances"]): CredOperDraft => ({
  interventions: [{ correlationID: "c1", credOperIntervType: 1 }],
  assets: [{ correlationID: "a1" }],
  insurances,
});

describe("insurance rules", () => {
  it("a complete car insurance is valid", () => expect(validateInsurance(car(), operation([]), today)).toEqual({}));

  it("expired driver license", () =>
    expect(
      validateInsurance(car({ driver: { licenseExpiryDate: "2026-10-04", mainDriverIsCustomer: true } }), operation([]), today),
    ).toEqual({ "insurances.car1.driver.licenseExpiryDate": "Driver license has expired." }));

  it("driver who isn't the customer needs name and license number", () => {
    const errors = validateInsurance(
      car({ driver: { licenseExpiryDate: "2030-01-01", mainDriverIsCustomer: false } }),
      operation([]),
      today,
    );
    expect(errors["insurances.car1.driver.name"]).toBe("This field is required.");
    expect(errors["insurances.car1.driver.licenseNumber"]).toBe("This field is required.");
  });

  it("at least one protection", () =>
    expect(validateInsurance(car({ protectionIds: [] }), operation([]), today)["insurances.car1.protectionIds"]).toBe(
      "Select at least one protection.",
    ));

  it("insured person removed", () =>
    expect(validateInsurance(protection("p1", { interventionRef: "gone" }), operation([]), today)["insurances.p1.link"]).toBe(
      "The insured person no longer exists.",
    ));

  it("insured vehicle removed", () =>
    expect(validateInsurance(car({ assetRef: "gone" }), operation([]), today)["insurances.car1.link"]).toBe(
      "The insured vehicle no longer exists.",
    ));

  it("duplicate only flags the later entry", () => {
    const all = [protection("p1"), protection("p2")];
    expect(isDuplicate(all[0], all)).toBe(false);
    expect(isDuplicate(all[1], all)).toBe(true);
    const errors = validateInsurances(operation(all), today);
    expect(errors["insurances.p1.duplicate"]).toBeUndefined();
    expect(errors["insurances.p2.duplicate"]).toBe("This insurance type is already added for this person/vehicle.");
  });

  it("the Insurances step uses these rules", () =>
    expect(validateInsurancesStep(operation([car({ protectionIds: [] })]), today)).toEqual({
      "insurances.car1.protectionIds": "Select at least one protection.",
    }));
});
