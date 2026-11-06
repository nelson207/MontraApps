import { stageOf, type CredOperDraft, type Stage } from "../model/credOperDraft";

// How the wizard decides what to work on when the screen is entered (spec §2).

/** Passed as React Router location state: navigate(path, { state: { intent } }) */
export type EntryIntent = "new" | "open" | "continue";

export type SessionNavState = { intent?: EntryIntent };

/** The URL parameter of a saved operation to open (Search → /quotation?id=…) */
export const OPEN_ID_PARAM = "id";

/** The URL parameter of a saved quotation to make a new proposal from (/proposal?fromQuotation=…) */
export const CONVERT_FROM_PARAM = "fromQuotation";

export type EntryDecision = "startNew" | "useStored" | "promptDiscard" | "fallbackNew" | "redirect" | "load" | "convert";

export function resolveEntry({
  intent,
  openId,
  convertFrom,
  stage,
  stored,
  isDirty,
}: {
  intent: EntryIntent;
  /** A saved operation to open (its id, from the URL): wins over the intent */
  openId?: string | null;
  /** A saved quotation to make a new proposal from (its id, from the URL; proposal screen only) */
  convertFrom?: string | null;
  /** The screen being entered */
  stage: Stage;
  stored: CredOperDraft | null;
  isDirty: boolean;
}): EntryDecision {
  if (convertFrom && stage === "proposal") return stored && isDirty ? "promptDiscard" : "convert";
  if (openId) {
    // Already the one being edited (Search → the same operation): as left, unsaved edits included
    if (stored?.id === openId) return stageOf(stored) === stage ? "useStored" : "redirect";
    return stored && isDirty ? "promptDiscard" : "load";
  }
  if (intent === "new") return stored && isDirty ? "promptDiscard" : "startNew";
  if (!stored) return "fallbackNew";
  // e.g. browser Back to an "open" entry after another operation was started:
  // show the stored operation on its own screen, never on the other stage's
  return stageOf(stored) === stage ? "useStored" : "redirect";
}

/** What the screen does once unsaved work is discarded: what was asked (convert, open one, or a new one) */
export const afterDiscard = (openId?: string | null, convertFrom?: string | null): EntryDecision =>
  convertFrom ? "convert" : openId ? "load" : "startNew";
