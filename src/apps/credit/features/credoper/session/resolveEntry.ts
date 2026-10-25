import { stageOf, type CredOperDraft, type Stage } from "../model/credOperDraft";

// How the wizard decides what to work on when the screen is entered (spec §2).

/** Passed as React Router location state: navigate(path, { state: { intent } }) */
export type EntryIntent = "new" | "open" | "continue";

export type SessionNavState = { intent?: EntryIntent };

export type EntryDecision = "startNew" | "useStored" | "promptDiscard" | "fallbackNew" | "redirect";

export function resolveEntry({
  intent,
  stage,
  stored,
  isDirty,
}: {
  intent: EntryIntent;
  /** The screen being entered */
  stage: Stage;
  stored: CredOperDraft | null;
  isDirty: boolean;
}): EntryDecision {
  if (intent === "new") return stored && isDirty ? "promptDiscard" : "startNew";
  if (!stored) return "fallbackNew";
  // e.g. browser Back to an "open" entry after another operation was started:
  // show the stored operation on its own screen, never on the other stage's
  return stageOf(stored) === stage ? "useStored" : "redirect";
}
