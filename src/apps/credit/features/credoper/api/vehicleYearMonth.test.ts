import { describe, expect, it } from "vitest";
import { toApiAsset } from "./credOperMapping";

describe("the vehicle's date, sent to the API", () => {
  const sent = (equipment: Record<string, unknown>) => toApiAsset({ correlationID: "a1", assetType: 1, equipment }, 0).equipment;

  it("the year and month go under their own names", () =>
    expect(sent({ equipYear: 2022, equipMonth: 3 })).toMatchObject({ equipYear: 2022, equipMonth: 3 }));

  it("an operation that already has a registration date keeps it", () =>
    expect(sent({ registrationDate: "2024-01-10" })).toMatchObject({ licenceDate: "2024-01-10" }));
});
