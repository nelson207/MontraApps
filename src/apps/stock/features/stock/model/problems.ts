import { problemMessage, problemStatus } from "@platform/api/problemCode";
import { tx } from "../stockText";

// Messages for MontraAPI's stock errors, by `code` (never the server's title). 401 never gets here
// as such: the API client refreshes the session or signs the user out.

export const STOCK_PROBLEM = {
  userHasNoEntity: "user_has_no_entity",
  stockNotActive: "stock_not_active",
} as const;

const codeMessages = (): Record<string, string> => ({
  user_has_no_entity: tx(
    "problems.noEntity",
    "Your user isn't linked to a dealer, so there are no agreements to show. Ask your administrator to link it.",
  ),
  stock_vehicle_limit_exceeded: tx("problems.vehicleLimit", "The amount is above this agreement's limit per vehicle."),
  stock_type_not_configured: tx("problems.typeNotConfigured", "This agreement isn't set up for stock of this type. Contact the back office."),
  stock_not_active: tx("problems.notActive", "One of the stocks is no longer active. Nothing was paid."),
  stock_payment_exceeds_due: tx("problems.exceedsDue", "The amount is above what the stocks still owe. Nothing was paid."),
  stock_payment_not_configured: tx("problems.paymentNotConfigured", "Payments aren't set up for this agreement. Contact the back office."),
});

/** The message for an error; a 404 means the record isn't this dealer's or the contract isn't active */
export function stockProblemMessage(error: unknown, fallback: string): string {
  const known = problemMessage(error, codeMessages());
  if (known) return known;
  if (problemStatus(error) === 404) return tx("problems.notAvailable", "This record isn't available: it isn't yours, or its agreement isn't active.");
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
