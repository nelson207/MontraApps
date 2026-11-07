import { problemMessage, problemStatus } from "@platform/api/problemCode";
import { tx } from "../factoringText";

// Messages for MontraAPI's factoring errors, by `code` (never the server's title). 401 never gets
// here as such: the API client refreshes the session or signs the user out.

const codeMessages = (): Record<string, string> => ({
  user_has_no_entity: tx("problems.noEntity", "Your user isn't linked to a dealer, so there are no agreements to show. Ask your administrator to link it."),
  factoring_not_configured: tx("problems.notConfigured", "This agreement isn't set up for this yet. Contact the back office."),
  factoring_advance_in_progress: tx(
    "problems.advanceInProgress",
    "This agreement already has an advance in progress. A new one can start once the back office has acted on it.",
  ),
});

/** The message for an error. `notFound` says what a 404 means on this screen. */
export function factoringProblemMessage(error: unknown, fallback: string, notFound?: string): string {
  const known = problemMessage(error, codeMessages());
  if (known) return known;
  if (problemStatus(error) === 404) return notFound ?? tx("problems.notAvailable", "This record isn't available: it isn't yours, or its agreement isn't active.");
  return fallback;
}

/**
 * Did the server refuse the request (nothing happened), or could it still have been processed?
 * A 4xx is a refusal. No response, a timeout, 5xx (502 included), an unreadable answer or a 401 say
 * nothing about the outcome, so the same correlationId must be used to try again.
 */
export function isDefiniteRefusal(error: unknown): boolean {
  const status = problemStatus(error);
  return status !== undefined && status >= 400 && status < 500 && status !== 401 && status !== 408;
}
