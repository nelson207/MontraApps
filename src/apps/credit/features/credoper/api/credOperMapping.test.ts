import { describe, expect, it } from "vitest";
import type { CredOperDto as DraftDto } from "@platform/api/legacy/legacyApi";
import { assetKindOut, fromApiCredOper, stepNumber, toApiCredOper } from "./credOperMapping";

const draft = (): DraftDto => ({
  id: "AQ7c2L0xOper7",
  amount: 15000,
  aplBusinessId: 1,
  financialProduct: 1041,
  creditIntermediaryStructNode: "snInterm11",
  showRoomStructNode: "snSupplier22",
  salePersonStructNode: "snVendor33",
  credOperClassification: 4,
  description: "Golf for Ana",
  customerName: "Ana Silva",
  customerEmail: { email: "ana@example.com" },
  correlationID: "op-1",
  metadataResponse: [],
  conditions: [{ term: 60, annualRate: 7.5, correlationID: "c-1", flows: [{ amount: 300, correlationID: "f-1" }] }],
  assets: [
    {
      correlationID: "a-1",
      equipment: {
        brand: "VW",
        model: "Golf",
        version: "1.0 TSI",
        doors: 5,
        enginesize: 999,
        registrationDate: "2024-01-10",
        odometer: 12000,
        description: "Blue",
        netAmount: 15000,
        correlationID: "e-1",
      },
    },
  ],
  interventions: [
    { correlationID: "i-1", credOperIntervType: 1, person: { birthDate: "1990-05-01" }, entity: {} },
  ],
});

describe("toApiCredOper", () => {
  const api = toApiCredOper(draft());

  it("sends the initial entry as its amount only: the percentage is a helper", () => {
    const op = draft();
    op.assets![0].equipment = { ...op.assets![0].equipment, retakeAmount: 1500, retakePercentage: 10 };
    const equipment = toApiCredOper(op).assets?.[0]?.equipment as Record<string, unknown>;
    expect(equipment.retakeAmount).toBe(1500);
    expect(equipment).not.toHaveProperty("retakePercentage");
  });

  it("renames the operation fields the new API names differently", () => {
    expect(api).toMatchObject({
      id: "AQ7c2L0xOper7",
      amount: 15000,
      financialProductId: 1041,
      creditIntermediaryStructNodeId: "snInterm11",
      importerStructNodeId: "snSupplier22",
      branchStructNodeId: "snVendor33",
      credOperClassificationId: 4,
      descr: "Golf for Ana",
      entityName: "Ana Silva",
    });
  });

  it("renames the vehicle fields", () => {
    expect(api.assets?.[0]?.equipment).toMatchObject({
      equipmentBrand: "VW",
      equipmentModel: "Golf",
      equipVersion: "1.0 TSI",
      numOfDoors: 5,
      engineSize: 999,
      licenceDate: "2024-01-10",
      descr: "Blue",
      netAmount: 15000,
    });
  });

  it("leaves out what only the app keeps", () => {
    const text = JSON.stringify(api);
    for (const key of ["correlationID", "metadataResponse", "customerEmail", "salePersonStructNode", "showRoomStructNode", "odometer", "\"brand\""]) {
      expect(text).not.toContain(key);
    }
    expect(api.insurances).toBeUndefined();
    // A person's details go as the API's entity, not as the app's parts
    expect(api.interventions?.[0]).not.toHaveProperty("person");
    expect(api.interventions?.[0].entity?.person).toMatchObject({ birthDate: "1990-05-01" });
  });
});

describe("fromApiCredOper", () => {
  it("brings the API's values back under the app's names", () => {
    const back = fromApiCredOper({ id: "AQ7c2L0xOper9", financialProductId: 2001, descr: "x", assets: [{ equipment: { equipmentBrand: "Seat" } }] });
    expect(back).toMatchObject({ id: "AQ7c2L0xOper9", financialProduct: 2001, description: "x" });
    expect(back.assets?.[0]?.equipment?.brand).toBe("Seat");
  });

  it("brings the network back: intermediary, supplier (importer), vendor (branch)", () =>
    expect(
      fromApiCredOper({ creditIntermediaryStructNodeId: "o1", importerStructNodeId: "u2", branchStructNodeId: "m3" }),
    ).toMatchObject({ creditIntermediaryStructNode: "o1", showRoomStructNode: "u2", salePersonStructNode: "m3" }));

  it("never takes the API's insurance policies as the app's insurances", () => {
    expect("insurances" in fromApiCredOper({ insurances: [{ insuranceTypeId: 7 }] } as never)).toBe(false);
  });

  it("keeps what only the app has (customer, people, links) through a round trip", () => {
    const base = draft();
    const answered = { ...toApiCredOper(base), amount: 16000 };
    answered.conditions = [{ ...answered.conditions![0], flows: [{ amount: 310 }] }];
    const back = fromApiCredOper(answered, base);

    expect(back.amount).toBe(16000);
    expect(back.customerEmail).toEqual({ email: "ana@example.com" });
    expect(back.salePersonStructNode).toBe("snVendor33");
    expect(back.correlationID).toBe("op-1");
    expect(back.conditions?.[0]).toMatchObject({ annualRate: 7.5, correlationID: "c-1" });
    expect(back.conditions?.[0]?.flows?.[0]).toMatchObject({ amount: 310, correlationID: "f-1" });
    expect(back.assets?.[0]).toMatchObject({ correlationID: "a-1" });
    expect(back.assets?.[0]?.equipment).toMatchObject({ brand: "VW", odometer: 12000, correlationID: "e-1" });
    expect(back.interventions?.[0]).toMatchObject({ correlationID: "i-1", person: { birthDate: "1990-05-01" } });
  });
});

describe("the step: a number in the draft, a name in the new API", () => {
  it("is sent by name and read back as the number", () => {
    expect(toApiCredOper({ credOperStep: 2 }).credOperStep).toBe("Proposal");
    expect(fromApiCredOper({ credOperStep: "Quotation" }).credOperStep).toBe(1);
    expect(fromApiCredOper(toApiCredOper({ credOperStep: 13 })).credOperStep).toBe(13);
  });

  it("isn't added when the draft has none, and an answer without one keeps the draft's", () => {
    expect("credOperStep" in toApiCredOper({ amount: 1 })).toBe(false);
    expect(fromApiCredOper({ amount: 1 }, { credOperStep: 2 }).credOperStep).toBe(2);
  });

  it("every name has its number", () =>
    expect(["Quotation", "Proposal", "Contract", "MLAContract", "ExternalOperation"].map((s) => stepNumber(s as never))).toEqual([
      1, 2, 3, 13, 99,
    ]));
});

describe("the asset type: an id in the draft (1 = equipment, 2 = building), a kind in the new API", () => {
  it("is sent as the kind (none for no asset) and read back as the id", () => {
    const api = toApiCredOper({ assets: [{ assetType: 2 }, { assetType: 1 }, { assetType: null }] });
    expect(api.assets?.map((a) => a.assetType)).toEqual(["Building", "Equipment", undefined]);
    expect(fromApiCredOper(api).assets?.map((a) => a.assetType)).toEqual([2, 1, undefined]);
  });

  it("an answer without it keeps the draft's; the operation's choice stays in the app", () => {
    expect(fromApiCredOper({ assets: [{ amount: 1 }] }, { assets: [{ assetType: 2 }] }).assets?.[0]?.assetType).toBe(2);
    expect("assetTypeId" in toApiCredOper({ assetTypeId: 1 } as never)).toBe(false);
  });
});

describe("assetKindOut (new-credoper's asset type)", () => {
  it("equipment and building by kind; no asset: none sent", () =>
    expect([1, 2, null, undefined].map(assetKindOut)).toEqual(["Equipment", "Building", undefined, undefined]));
});

describe("assetItem: the asset's position, from 1", () => {
  it("is renumbered on every send, whatever the draft had (vehicles added and removed)", () =>
    expect(toApiCredOper({ assets: [{ assetItem: 2 }, {}, { assetItem: 1 }] }).assets?.map((a) => a.assetItem)).toEqual([1, 2, 3]));
});

describe("what only the API sets, and the operation's identity", () => {
  it("state, state date and entry moment are never sent", () => {
    const out = toApiCredOper({ id: "AQ1", autUserStateId: 3, stateDate: "2026-11-03", entryMoment: "2026-11-03T10:00:00Z" });
    expect(out).not.toHaveProperty("autUserStateId");
    expect(out).not.toHaveProperty("stateDate");
    expect(out).not.toHaveProperty("entryMoment");
  });

  it("correlationId and rowVersion go as they are", () => {
    const identity = { correlationId: "5b1c6c1e-0000-4000-8000-000000000001", rowVersion: "AAAAAAAAB9E=" };
    expect(toApiCredOper({ id: "AQ1", ...identity } as DraftDto)).toMatchObject({ id: "AQ1", ...identity });
  });

  it("an answer without them (a calculation) keeps the draft's", () => {
    const base = { id: "AQ1", correlationId: "c-1", rowVersion: "rv-1", amount: 1 } as DraftDto;
    expect(fromApiCredOper({ amount: 2, correlationId: null, rowVersion: null }, base)).toMatchObject({
      id: "AQ1",
      correlationId: "c-1",
      rowVersion: "rv-1",
      amount: 2,
    });
  });

  it("replacing (a save): the answer's rowVersion, never the old one; the correlationId is never lost", () => {
    const base = { id: "AQ1", correlationId: "c-1", rowVersion: "rv-1" } as DraftDto;
    expect(fromApiCredOper({ id: "AQ1", rowVersion: "rv-2" }, base, "replace")).toMatchObject({ correlationId: "c-1", rowVersion: "rv-2" });
    expect(fromApiCredOper({ id: "AQ1" }, base, "replace")).not.toHaveProperty("rowVersion");
  });
});

describe("a proposal made from a quotation", () => {
  const proposal = { credOperStep: 2, sourceCredOperId: "AQquote", sourceQuotation: { id: "AQquote", number: 4521 } } as DraftDto;

  it("sends its sourceCredOperId as it is, never the quotation's summary (the app's)", () => {
    const out = toApiCredOper(proposal);
    expect(out).toMatchObject({ sourceCredOperId: "AQquote" });
    expect(out).not.toHaveProperty("sourceQuotation");
  });

  it("an answer (a save, a calculation) keeps the summary, and the link when it leaves it out", () => {
    for (const mode of ["replace", "merge"] as const) {
      expect(fromApiCredOper({ id: "APtoken" }, proposal, mode)).toMatchObject({
        sourceCredOperId: "AQquote",
        sourceQuotation: { id: "AQquote", number: 4521 },
      });
    }
  });
});

describe("the people: the API's intervention entity", () => {
  const ana: DraftDto = {
    interventions: [
      {
        correlationID: "i-1",
        credOperIntervType: 1,
        entity: { fullName: "Ana Maria Silva", legalDocs: [{ legalDocTypeId: 3, legalDocNumber: "123456789" }] },
        person: { id: "p", correlationID: "x", birthDate: "1988-04-12", metadataResponse: [] },
        entityEmail: { email: "ana@example.com" },
        entityMobilePhone: { phoneNumber: "912345678", phoneTypeId: 2 },
        entityLandlinePhone: { phoneNumber: "212345678", phoneTypeId: 1 },
        fiscalEntityAddress: { street: "Rua Augusta 100", postalCode: "1100-053", countryId: "PRT" },
        metadataResponse: [],
      },
    ],
  };

  it("sent as the entity: NIF, person (first and last names), phones (the mobile selected), e-mail and one address for both", () => {
    const [sent] = toApiCredOper(ana).interventions!;
    const address = {
      addressTypeId: null,
      details: expect.objectContaining({ street: "Rua Augusta 100", postalCode: "1100-053", countryId: "PRT" }),
    };
    expect(sent.entity).toEqual({
      vatNumber: "123456789",
      kind: "Person",
      person: { birthDate: "1988-04-12", firstName: "Ana", lastName: "Maria Silva" },
      phone: { phoneNumber: "912345678", phoneTypeId: 2, isMain: true },
      availablePhones: [
        { phoneNumber: "912345678", phoneTypeId: 2, isMain: true },
        { phoneNumber: "212345678", phoneTypeId: 1, isMain: false },
      ],
      email: { emailAddress: "ana@example.com", isMain: true },
      fiscalAddress: address,
      postalAddress: address,
    });
    // Typed: no id. The flags are the API's
    expect(sent.entity?.fiscalAddress).not.toHaveProperty("id");
    expect(sent.entity?.fiscalAddress?.details).not.toHaveProperty("isFiscal");
    expect(sent.entity?.fiscalAddress?.details).not.toHaveProperty("isPostal");
    // The app's own parts aren't sent
    expect(sent).not.toHaveProperty("person");
    expect(sent).not.toHaveProperty("entityEmail");
    expect(sent).not.toHaveProperty("correlationID");
  });

  it("a company is sent as one, without a person", () => {
    const [sent] = toApiCredOper({
      interventions: [{ entity: { entityTypeId: 2, fullName: "Acme, Lda." }, company: { registryNumber: "R1", id: "c" } }],
    }).interventions!;
    expect(sent.entity).toMatchObject({ kind: "Company", company: { registryNumber: "R1" } });
    expect(sent.entity?.person).toBeUndefined();
    expect(sent.entity?.company).not.toHaveProperty("id");
  });

  it("read back over what only the app keeps (the landline, the links)", () => {
    const answer = toApiCredOper(ana);
    answer.interventions![0].id = "AItoken";
    answer.interventions![0].entityId = "AEtoken";
    delete answer.interventions![0].entity!.availablePhones;
    answer.interventions![0].entity!.email = { id: "AMtoken", emailAddress: "ana.silva@example.com", isMain: true };
    const [read] = fromApiCredOper(answer, ana, "replace").interventions!;
    expect(read).toMatchObject({
      id: "AItoken",
      correlationID: "i-1",
      credOperIntervType: 1,
      entity: { id: "AEtoken", fullName: "Ana Maria Silva" },
      person: { firstName: "Ana", lastName: "Maria Silva", birthDate: "1988-04-12" },
      entityEmail: { id: "AMtoken", email: "ana.silva@example.com" },
      entityMobilePhone: { phoneNumber: "912345678" },
      entityLandlinePhone: { phoneNumber: "212345678" },
      fiscalEntityAddress: { street: "Rua Augusta 100", postalCode: "1100-053", countryId: "PRT" },
    });
    expect(read.entity?.legalDocs?.find((d) => d.legalDocTypeId === 3)?.legalDocNumber).toBe("123456789");
  });

  it("with the entity's list, the landline saved is chosen from it like the others", () => {
    const answer = toApiCredOper(ana);
    answer.interventions![0].entityId = "AEtoken";
    answer.interventions![0].entity!.availablePhones = [{ id: "P1", phoneNumber: "912345678" }, { id: "P2", phoneNumber: "212345678" }];
    const [read] = fromApiCredOper(answer, ana, "replace").interventions!;
    expect(read.availablePhones).toHaveLength(2);
    expect(read.entityLandlinePhone?.phoneNumber).toBeUndefined();
  });

  it("an opened operation's person: their details from the API", () => {
    const [read] = fromApiCredOper({
      interventions: [
        {
          id: "AItoken",
          entityId: "AEtoken",
          entity: { vatNumber: "500000000", kind: "Company", company: { registryNumber: "R1" }, phone: { phoneNumber: "210000100" } },
        },
      ],
    }).interventions!;
    expect(read).toMatchObject({
      entity: { id: "AEtoken", entityTypeId: 2 },
      company: { registryNumber: "R1" },
      entityMobilePhone: { phoneNumber: "210000100" },
    });
    expect(read.entity?.legalDocs?.[0]).toMatchObject({ legalDocTypeId: 3, legalDocNumber: "500000000" });
  });
});
