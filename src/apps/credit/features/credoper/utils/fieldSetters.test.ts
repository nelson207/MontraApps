import { describe, expect, it } from "vitest";
import type { AppDispatch } from "@credit/store";
import { setEquipmentField, setEquipmentFields, setLandLinePhoneField, setMobilePhoneField } from "./fieldSetters";

const recorder = () => {
  const actions: unknown[] = [];
  return { actions, dispatch: ((action: unknown) => actions.push(action)) as unknown as AppDispatch };
};

describe("phone setters", () => {
  it("an empty number reported for an empty phone is not an edit", () => {
    const { actions, dispatch } = recorder();
    setMobilePhoneField(dispatch, { customerPhone: undefined }, "phoneNumber", "");
    setLandLinePhoneField(dispatch, { customerLandLine: { phoneNumber: null } }, "phoneNumber", "");
    expect(actions).toHaveLength(0);
  });

  it("a real change is dispatched", () => {
    const { actions, dispatch } = recorder();
    setMobilePhoneField(dispatch, { customerPhone: undefined }, "phoneNumber", "+351912345678");
    expect(actions).toHaveLength(1);
  });
});

describe("setEquipmentField", () => {
  const op = { assets: [{ equipment: { retakeAmount: 2000 } }] };

  it("setting the value it already has is not an edit (derived values on mount)", () => {
    const { actions, dispatch } = recorder();
    setEquipmentField(dispatch, op, 0, "retakeAmount", 2000);
    expect(actions).toHaveLength(0);
  });

  it("a different value is dispatched", () => {
    const { actions, dispatch } = recorder();
    setEquipmentField(dispatch, op, 0, "retakeAmount", 2500);
    expect(actions).toHaveLength(1);
  });
});

describe("setEquipmentFields", () => {
  it("changes several fields at once (brand clears model and version)", () => {
    const { actions, dispatch } = recorder();
    setEquipmentFields(dispatch, { assets: [{ equipment: { brand: "A", model: "M", version: "V" } }] }, 0, { brand: "B", model: null, version: null });
    expect(actions).toEqual([
      expect.objectContaining({ payload: { assets: [{ equipment: { brand: "B", model: null, version: null } }] } }),
    ]);
  });

  it("no change, no edit", () => {
    const { actions, dispatch } = recorder();
    setEquipmentFields(dispatch, { assets: [{ equipment: { brand: "A" } }] }, 0, { brand: "A" });
    expect(actions).toHaveLength(0);
  });
});
