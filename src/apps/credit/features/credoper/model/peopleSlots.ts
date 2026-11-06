import type { CredOperDto } from "@platform/api/legacy/legacyApi";
import { interventionRole, secondHolderBlock } from "./credOperDraft";

// The people of a proposal as the Interventions step lays them out, a row (page) of
// PEOPLE_PER_PAGE at a time: the customer first, then always the second holder's place (them, the
// card to add one, or why there can't be one, e.g. a company customer), so guarantors always
// start third. The card to add a guarantor takes the next free place, when the last row has one.

/** Cards per row (four fit a full HD screen); more are paged */
export const PEOPLE_PER_PAGE = 4;

export type NewPersonKind = "secondHolder" | "guarantor";

export type PeopleSlot =
  /** A person: their position in the operation's interventions */
  | { kind: "person"; index: number }
  /** The card to add one; with `blocked`, why it can't be (shown, not clickable) */
  | { kind: "add"; person: NewPersonKind; blocked: string | null };

/** `blocked`: why nobody can be added yet (see classificationBlock) */
export function peopleSlots(op: CredOperDto, blocked: string | null = null): PeopleSlot[] {
  const people = op.interventions ?? [];
  const indexes = people.map((_, i) => i);
  const customer = indexes.find((i) => interventionRole(people[i]) === "customer");
  const secondHolder = indexes.find((i) => interventionRole(people[i]) === "secondHolder");
  const others = indexes.filter((i) => i !== customer && i !== secondHolder);

  const slots: PeopleSlot[] = [];
  if (customer !== undefined) slots.push({ kind: "person", index: customer });
  slots.push(
    secondHolder !== undefined
      ? { kind: "person", index: secondHolder }
      : { kind: "add", person: "secondHolder", blocked: blocked ?? secondHolderBlock(op) },
  );
  slots.push(...others.map((index) => ({ kind: "person" as const, index })));
  // Never a page of its own: only in a free place of the last row
  if (slots.length % PEOPLE_PER_PAGE !== 0) slots.push({ kind: "add", person: "guarantor", blocked });
  return slots;
}

/** The page (row) a person's card is on */
export const pageOfPerson = (slots: PeopleSlot[], index: number): number =>
  Math.max(0, Math.floor(slots.findIndex((s) => s.kind === "person" && s.index === index) / PEOPLE_PER_PAGE));
