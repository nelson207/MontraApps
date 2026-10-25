import { describe, expect, it } from "vitest";
import {
  changedContacts,
  emailsToConfirm,
  isRemovable,
  newEmail,
  newPhone,
  phonePrefixOf,
  toContactsDraft,
  validateContacts,
  withMain,
} from "./contactDetails";

const saved = toContactsDraft({
  emails: [{ id: "tok-e1", emailAddress: "ana@example.com", isMain: true, isValidated: true }],
  phones: [{ id: "tok-p1", countryId: "PRT", phoneNumber: "912345678", isMain: true }],
  addresses: [],
});

describe("changedContacts (PUT /api/users/me/contact-details)", () => {
  it("nothing changed: nothing to send", () => expect(changedContacts(saved, saved)).toBeNull());

  it("sends only the lists that changed; an edited item keeps its id, the local key never goes", () => {
    const edited = { ...saved, emails: [{ ...saved.emails[0], emailAddress: " ana.silva@example.com " }] };
    expect(changedContacts(saved, edited)).toEqual({
      emails: [{ id: "tok-e1", emailAddress: "ana.silva@example.com", isMain: true, isValidated: true }],
    });
  });

  it("a new item has no id", () => {
    const edited = { ...saved, phones: [...saved.phones, { ...newPhone(false, "ESP"), phoneNumber: "600 111 222" }] };
    const request = changedContacts(saved, edited);
    expect(request?.emails).toBeUndefined();
    expect(request?.phones?.[1]).toEqual({ countryId: "ESP", phoneNumber: "600111222", isMain: false });
  });

  it("only new items can be removed (nothing is deleted on the server)", () => {
    expect(isRemovable(saved.emails[0])).toBe(false);
    expect(isRemovable(newEmail(false))).toBe(true);
  });
});

describe("emailsToConfirm", () => {
  it("lists new and changed addresses, not untouched ones (case-insensitive)", () => {
    const added = { ...newEmail(false), emailAddress: "work@example.com" };
    const edited = { ...saved, emails: [{ ...saved.emails[0], emailAddress: "ANA@example.com" }, added] };
    expect(emailsToConfirm(saved, edited)).toEqual(["work@example.com"]);
  });
});

describe("validateContacts", () => {
  it("flags bad e-mails, phones without country or with wrong digits", () => {
    const email = { ...newEmail(false), emailAddress: "nope" };
    const phone = { ...newPhone(false, null), phoneNumber: "12" };
    const errors = validateContacts({ emails: [email], phones: [phone], addresses: [] });
    expect(Object.keys(errors).sort()).toEqual(
      [`emails.${email.key}.emailAddress`, `phones.${phone.key}.countryId`, `phones.${phone.key}.phoneNumber`].sort(),
    );
  });

  it("the saved contacts are valid", () => expect(validateContacts(saved)).toEqual({}));
});

describe("helpers", () => {
  it("withMain keeps one main item", () => {
    const list = [{ key: "a", isMain: true }, { key: "b", isMain: false }];
    expect(withMain(list, "b").map((i) => i.isMain)).toEqual([false, true]);
  });

  it("phonePrefixOf reads the country's prefix by id (PRT, not PT)", () => {
    const countries = [{ id: "PRT", alpha2Code: "PT", abbreviation: "Portugal", phonePrefix: 351 }];
    expect(phonePrefixOf(countries, "PRT")).toBe("+351");
    expect(phonePrefixOf(countries, "PT")).toBeNull();
  });
});
