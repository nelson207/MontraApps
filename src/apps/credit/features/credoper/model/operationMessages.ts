import type { CalculationMessageDto } from "@platform/api/generated/MontraPOSApi";

// The messages the API answers a calculation or a save with: errors to fix, warnings to review and
// information (notes). Whether the save worked is the answer's isSaved, never read from these.

export type MessageSeverity = "error" | "warning" | "info";
export type MessageSource = "save" | "calculation";
export type OperationMessage = { severity: MessageSeverity; text: string; source: MessageSource };

/** What the last save answered, until the next one replaces it */
export type SaveOutcome = {
  saved: boolean;
  messages: OperationMessage[];
  /** The operation's revision when it was sent: a newer one means it was edited since */
  revision: number;
  /** A save that failed: why */
  error?: unknown;
};

const SEVERITIES: Record<string, MessageSeverity> = {
  error: "error",
  warning: "warning",
  info: "info",
  information: "info",
  informative: "info",
};

const ORDER: MessageSeverity[] = ["error", "warning", "info"];

type MessageList = CalculationMessageDto[] | null | undefined;

const fromApi = (list: MessageList, source: MessageSource): OperationMessage[] =>
  (list ?? []).flatMap((message) => {
    const text = message.text?.trim();
    if (!text) return [];
    // Free text in the API: one it doesn't name is still shown, never lost
    const severity = SEVERITIES[message.severity?.trim().toLowerCase() ?? ""] ?? "warning";
    return [{ severity, text, source }];
  });

/** The messages to show: most severe first, in the API's order within a level, each text once */
export function operationMessages({ save, calculation }: { save?: MessageList; calculation?: MessageList }): OperationMessage[] {
  const all = [...fromApi(save, "save"), ...fromApi(calculation, "calculation")];
  const sorted = ORDER.flatMap((severity) => all.filter((message) => message.severity === severity));
  return sorted.filter((message, index) => sorted.findIndex((other) => other.text === message.text) === index);
}

export function messagesBySeverity(messages: OperationMessage[]): Record<MessageSeverity, OperationMessage[]> {
  const of = (severity: MessageSeverity) => messages.filter((message) => message.severity === severity);
  return { error: of("error"), warning: of("warning"), info: of("info") };
}

export const countOf = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** "2 errors, 1 warning"; notes only when there's nothing more pressing */
export function countsLabel(messages: OperationMessage[]): string {
  const { error, warning, info } = messagesBySeverity(messages);
  const counts = [
    ...(error.length ? [countOf(error.length, "error")] : []),
    ...(warning.length ? [countOf(warning.length, "warning")] : []),
  ];
  return counts.length ? counts.join(", ") : info.length ? countOf(info.length, "note") : "";
}

/** The sheet opens by itself only when there's something to act on or review; the bar has the rest */
export const opensAfterSave = ({ saved, messages }: SaveOutcome): boolean =>
  !saved || messages.some((message) => message.severity !== "info");

/** A calculation message is fixed in Financial data: an error there marks that step */
export const hasCalculationError = (messages: OperationMessage[]): boolean =>
  messages.some((message) => message.severity === "error" && message.source === "calculation");
