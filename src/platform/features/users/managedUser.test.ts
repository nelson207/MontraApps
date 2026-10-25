import { describe, expect, it } from "vitest";
import { newPhone, toContactsDraft } from "@platform/features/account/contactDetails";
import { EMPTY_USER_FORM, fromManagedUser, toCreateRequest, toUpdateRequest, validateUserForm } from "./managedUser";

const user = {
  id: "tok-u1",
  userName: "asilva",
  fullName: "Ana Silva",
  abbreviation: "AS",
  culture: "pt-PT",
  uiCulture: "pt-PT",
  aplUserTypeId: 2,
  authorizationLevel: 3,
  invalidDate: null,
  entityId: "tok-ent",
  contacts: { emails: [{ id: "tok-e1", emailAddress: "ana@example.com", isMain: true }], phones: [] },
};

describe("validateUserForm", () => {
  it("create needs a user name (no spaces) and a full name", () => {
    expect(validateUserForm(EMPTY_USER_FORM, "create")).toEqual({ userName: "Enter the user name.", fullName: "Enter the full name." });
    expect(validateUserForm({ ...EMPTY_USER_FORM, userName: "a silva", fullName: "A" }, "create").userName).toMatch(/no spaces/);
  });

  it("checks the e-mail, numbers and cultures only when given", () => {
    const errors = validateUserForm(
      { ...EMPTY_USER_FORM, userName: "a", fullName: "A", email: "x", authorizationLevel: "2.5", culture: "portuguese" },
      "create",
    );
    expect(Object.keys(errors).sort()).toEqual(["authorizationLevel", "culture", "email"]);
    expect(validateUserForm({ ...EMPTY_USER_FORM, userName: "a", fullName: "A" }, "create")).toEqual({});
  });
});

describe("toCreateRequest", () => {
  it("trims, converts numbers and leaves blanks out", () =>
    expect(toCreateRequest({ ...EMPTY_USER_FORM, userName: " asilva ", fullName: "Ana Silva", authorizationLevel: "3" })).toEqual({
      userName: "asilva",
      fullName: "Ana Silva",
      abbreviation: undefined,
      email: undefined,
      aplUserTypeId: undefined,
      authorizationLevel: 3,
      culture: undefined,
      uiCulture: undefined,
    }));
});

describe("toUpdateRequest", () => {
  const saved = { values: fromManagedUser(user), contacts: toContactsDraft(user.contacts) };

  it("nothing changed: nothing to send", () => expect(toUpdateRequest(saved, saved)).toBeNull());

  it("sends only the changed fields", () => {
    const edited = { ...saved, values: { ...saved.values, fullName: "Ana M. Silva", authorizationLevel: "4" } };
    expect(toUpdateRequest(saved, edited)).toEqual({ fullName: "Ana M. Silva", authorizationLevel: 4 });
  });

  it("contacts follow the profile rules: only the changed list, new items without id", () => {
    const edited = { ...saved, contacts: { ...saved.contacts, phones: [{ ...newPhone(true, "PRT"), phoneNumber: "912345678" }] } };
    expect(toUpdateRequest(saved, edited)).toEqual({ phones: [{ countryId: "PRT", phoneNumber: "912345678", isMain: true }] });
  });

  it("a date from which the user can't sign in", () => {
    const edited = { ...saved, values: { ...saved.values, invalidDate: "2026-12-31" } };
    expect(toUpdateRequest(saved, edited)).toEqual({ invalidDate: "2026-12-31T00:00:00" });
  });
});
