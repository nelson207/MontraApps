import { describe, expect, it } from "vitest";
import type { CredOperDto, CredOperIntervDto } from "@platform/api/legacy/legacyApi";
import { loadExisting } from "../credoperSlice";
import {
  initialNif,
  isLookupPending,
  isNewEntity,
  isValidNif,
  normalizeNif,
  vatOf,
  VAT_DOC_TYPE,
  withEntityData,
  withQuotationCustomer,
  withVat,
} from "./entityLookup";
import reducer, { choseManual, filled, lookedUp, otpSent, searchAgain } from "./entityLookupSlice";

const customer = (extra: Partial<CredOperIntervDto> = {}): CredOperIntervDto => ({
  correlationID: "c1",
  credOperIntervType: 1,
  entity: {},
  person: {},
  ...extra,
});

describe("NIF", () => {
  it.each(["123456789", "500000000", "501964843"])("%s is valid", (nif) => expect(isValidNif(nif)).toBe(true));
  it.each(["123456780", "12345678", "1234567890", "abcdefghi", ""])("%s isn't", (nif) => expect(isValidNif(nif)).toBe(false));
  it("as typed: spaces, dots and a PT prefix go", () => expect(normalizeNif("PT 123.456 789")).toBe("123456789"));
});

describe("the person's NIF is their VAT document", () => {
  it("added when there's none", () => {
    const person = withVat(customer({ entity: { legalDocs: [{ legalDocTypeId: 1, legalDocNumber: "CC1" }] } }), "123456789");
    expect(person.entity?.legalDocs).toHaveLength(2);
    expect(vatOf(person)).toBe("123456789");
  });

  it("replaced when there is one", () => {
    const person = withVat(customer({ entity: { legalDocs: [{ legalDocTypeId: VAT_DOC_TYPE, legalDocNumber: "1" }] } }), "123456789");
    expect(person.entity?.legalDocs).toEqual([{ legalDocTypeId: VAT_DOC_TYPE, legalDocNumber: "123456789" }]);
  });
});

describe("a new person waits for the lookup", () => {
  it("new: no database entity, no name", () => {
    expect(isNewEntity(customer())).toBe(true);
    expect(isNewEntity(customer({ entity: { fullName: "Ana" } }))).toBe(false);
    expect(isNewEntity(customer({ entity: { id: "e1" } }))).toBe(false);
  });

  it("pending until searched, and while found and undecided", () => {
    const vat = "123456789";
    expect(isLookupPending(customer(), undefined)).toBe(true);
    expect(isLookupPending(customer(), { vat, outcome: "found" })).toBe(true);
    expect(isLookupPending(customer(), { vat, outcome: "notFound" })).toBe(false);
    expect(isLookupPending(customer(), { vat, outcome: "manual" })).toBe(false);
    // Opened with its data: never asked
    expect(isLookupPending(customer({ entity: { id: "e1", fullName: "Ana" } }), undefined)).toBe(false);
  });
});

describe("filled from the database", () => {
  it("the database's data, keeping what makes them this operation's person", () => {
    const person = customer({ id: "i1", metadataResponse: [], entity: { fullName: "" } });
    const out = withEntityData(
      person,
      { entity: { id: "e9", fullName: "Ana Silva", legalDocs: [{ legalDocTypeId: 1, legalDocNumber: "CC1" }] }, person: { birthDate: "1988-04-12" } },
      "123456789",
    );
    expect(out).toMatchObject({ id: "i1", correlationID: "c1", credOperIntervType: 1, person: { birthDate: "1988-04-12" } });
    expect(out.entity).toMatchObject({ id: "e9", fullName: "Ana Silva" });
    expect(out.entity?.legalDocs?.map((d) => d.legalDocTypeId)).toEqual([1, VAT_DOC_TYPE]);
    expect(out.entity?.legalDocs?.every((d) => d.correlationID)).toBe(true);
  });
});

describe("the quotation's customer moves to the proposal's customer card", () => {
  const op: CredOperDto = {
    customerName: "Ana Silva",
    customerVAT: { legalDocNumber: "PT123456789" },
    customerEmail: { email: "ana@example.com" },
    customerPhone: { phoneNumber: "+351912345678" },
  };

  it("its NIF starts the lookup", () => {
    expect(initialNif(customer(), op)).toBe("123456789");
    // Not for the other people
    expect(initialNif(customer({ credOperIntervType: 4 }), op)).toBe("");
  });

  it("filled in by hand: what's blank takes the quotation's", () => {
    const out = withQuotationCustomer(customer({ entityEmail: { email: "typed@example.com" } }), op);
    expect(out.entity?.fullName).toBe("Ana Silva");
    expect(out.entityEmail?.email).toBe("typed@example.com");
    expect(out.entityMobilePhone?.phoneNumber).toBe("+351912345678");
  });
});

describe("entityLookupSlice", () => {
  const otp = { requestId: "r1", validUntil: "2026-11-01T10:05:00Z" };

  it("a code request stays resumable after choosing to fill in by hand, until filled", () => {
    let state = reducer(undefined, lookedUp({ ref: "c1", vat: "123456789", found: true, phone: "+351 9•• ••• 321" }));
    state = reducer(state, otpSent({ ref: "c1", otp }));
    state = reducer(state, choseManual({ ref: "c1", vat: "123456789" }));
    expect(state.c1).toMatchObject({ outcome: "manual", otp, phone: "+351 9•• ••• 321" });
    state = reducer(state, filled("c1"));
    expect(state.c1.outcome).toBe("filled");
    expect(state.c1.otp).toBeUndefined();
  });

  it("searched again for the same NIF, a code already sent can still be entered; another NIF drops it", () => {
    let state = reducer(undefined, lookedUp({ ref: "c1", vat: "123456789", found: true }));
    state = reducer(state, otpSent({ ref: "c1", otp }));
    state = reducer(state, choseManual({ ref: "c1", vat: "123456789" }));
    state = reducer(state, searchAgain({ ref: "c1", vat: "123456789" }));
    expect(state.c1).toMatchObject({ outcome: "search", otp });
    expect(reducer(state, lookedUp({ ref: "c1", vat: "123456789", found: true })).c1.otp).toEqual(otp);
    expect(reducer(state, lookedUp({ ref: "c1", vat: "500000000", found: true })).c1.otp).toBeUndefined();
  });

  it("pending again while searching anew, even with details typed", () => {
    const typed = customer({ entity: { fullName: "Ana" } });
    expect(isLookupPending(typed, { vat: "123456789", outcome: "search" })).toBe(true);
    expect(isLookupPending(typed, { vat: "123456789", outcome: "manual" })).toBe(false);
  });

  it("another operation starts over", () => {
    const state = reducer(reducer(undefined, lookedUp({ ref: "c1", vat: "1", found: false })), loadExisting({ insurances: [] }));
    expect(state).toEqual({});
  });
});
