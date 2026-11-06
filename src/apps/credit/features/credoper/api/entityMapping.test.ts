import { describe, expect, it } from "vitest";
import type { AddressDto } from "@platform/api/generated/MontraPOSApi";
import { isCompany } from "../model/credOperDraft";
import { entityFromApi, entityFromPreload, nameParts, toApiEntity } from "./entityMapping";

describe("the name, as first and last names", () => {
  it("the first word and the rest", () => expect(nameParts("  Ana   Maria Silva ", {})).toEqual({ firstName: "Ana", lastName: "Maria Silva" }));
  it("one word: no last name", () => expect(nameParts("Ana", {})).toEqual({ firstName: "Ana", lastName: null }));
  it("the person's own, while they still make up the name", () =>
    expect(nameParts("Ana Maria Silva", { firstName: "Ana Maria", lastName: "Silva" })).toEqual({ firstName: "Ana Maria", lastName: "Silva" }));
  it("nothing typed: the person's", () => expect(nameParts("", { firstName: "Ana" })).toEqual({ firstName: "Ana", lastName: null }));
});

describe("an address without its text", () => {
  it.each([
    ["null", { id: "a1", singleLine: null, lines: null }],
    ["left out", { id: "a1" }],
  ])("singleLine and lines %s: empty fields", (_, address) => {
    const data = entityFromPreload({ id: "AEtoken", addresses: [address as AddressDto] }, "Person");
    expect(data.fiscalEntityAddress).toMatchObject({ id: "a1", street: null, postalCode: null, locality: null });
  });
});

describe("the entity the NIF lookup preloads", () => {
  it("a person: the database's entity, with the main contacts and the fiscal address", () => {
    const data = entityFromPreload(
      {
      id: "AEtoken",
      entityTypeId: 1,
      name: "Ana Maria Silva",
      person: { firstName: "Ana Maria", lastName: "Silva", birthDate: "1988-04-12" },
      emails: [
        { id: "m0", emailAddress: "old@example.com" },
        { id: "m1", emailAddress: "ana@example.com", isMain: true },
      ],
      phones: [{ id: "t1", phoneNumber: "912345678" }],
      addresses: [
        { id: "a1", details: { street: "Rua do Correio 1" } },
        { id: "a2", details: { street: "Rua Augusta 100", postalCode: "1100-053", isFiscal: true } },
      ],
      },
      "Person",
    );
    expect(data).toMatchObject({
      entity: { id: "AEtoken", entityTypeId: 1, fullName: "Ana Maria Silva", legalDocs: [] },
      person: { firstName: "Ana Maria", birthDate: "1988-04-12" },
      entityEmail: { id: "m1", email: "ana@example.com" },
      entityMobilePhone: { id: "t1", phoneNumber: "912345678" },
      fiscalEntityAddress: { id: "a2", street: "Rua Augusta 100", postalCode: "1100-053", isFiscal: true },
    });
    expect(data).not.toHaveProperty("company");
  });

  it("a company: its company part, no person", () => {
    const data = entityFromPreload({ id: "AEtoken", entityTypeId: 2, name: "Acme, Lda.", company: { registryNumber: "R1" } }, "Company");
    expect(data).toMatchObject({ entity: { fullName: "Acme, Lda.", entityTypeId: 2 }, company: { registryNumber: "R1" } });
    expect(data).not.toHaveProperty("person");
  });

  it("a company with no name of its own: its registryDescription", () => {
    const data = entityFromPreload({ id: "AEtoken", company: { registryDescription: "Acme, Lda." } }, "Company");
    expect(data.entity?.fullName).toBe("Acme, Lda.");
  });

  it("the kind asked for decides, whatever the database's own type id is", () => {
    const data = entityFromPreload({ id: "AEtoken", entityTypeId: 7, name: "Acme, Lda.", company: { registryNumber: "R1" } }, "Company");
    expect(isCompany(data)).toBe(true);
  });
});

describe("a company's name is its registryDescription", () => {
  const company = { correlationID: "c1", entity: { entityTypeId: 2, fullName: " Acme, Lda. " }, company: { registryNumber: "R1" } };

  it("the name typed goes out as it, with the rest of the company's part", () => {
    expect(toApiEntity(company)).toMatchObject({ kind: "Company", company: { registryNumber: "R1", registryDescription: "Acme, Lda." } });
  });

  it("no name typed: what it had stays", () => {
    const unnamed = { ...company, entity: { entityTypeId: 2 }, company: { registryDescription: "Old name" } };
    expect(toApiEntity(unnamed).company?.registryDescription).toBe("Old name");
  });

  it("a person's name doesn't go there", () => {
    const person = { correlationID: "p1", entity: { fullName: "Ana Silva" }, person: {} };
    expect(toApiEntity(person).company).toBeUndefined();
  });

  it("comes back as the name", () => {
    const data = entityFromApi("e1", { kind: "Company", company: { registryDescription: "Acme, Lda." } }, { correlationID: "c1", entity: {} });
    expect(data.entity?.fullName).toBe("Acme, Lda.");
  });

  it("an answer without it keeps the name typed", () => {
    const data = entityFromApi("e1", { kind: "Company", company: {} }, { correlationID: "c1", entity: { fullName: "Acme, Lda." } });
    expect(data.entity?.fullName).toBe("Acme, Lda.");
  });
});
