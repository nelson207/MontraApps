import type { StockText } from "../stockText";

// A stock unit's state, as the API names it. "Activate" means active; only those can be paid.

export const ACTIVE_STATE = "Activate";

export const isPayable = (state: string | null | undefined): boolean => state === ACTIVE_STATE;

/** The state in the user's language. Null gets a neutral label; a state not known yet is shown as it comes. */
export function stateLabel(state: string | null | undefined, tx: StockText): string {
  switch (state) {
    case null:
    case undefined:
    case "":
      return tx("state.none", "No state");
    case "Initial":
      return tx("state.initial", "Initial");
    case "Activate":
      return tx("state.active", "Active");
    case "Terminate":
      return tx("state.terminated", "Terminated");
    case "Cancel":
      return tx("state.cancelled", "Cancelled");
    case "Sold":
      return tx("state.sold", "Sold");
    case "TermByNC":
      return tx("state.termByNc", "Terminated by credit note");
    case "Pending":
      return tx("state.pending", "Pending");
    case "Approved":
      return tx("state.approved", "Approved");
    default:
      return state;
  }
}

export function stateBadgeClass(state: string | null | undefined): string {
  switch (state) {
    case "Activate":
      return "bg-success-subtle text-success-emphasis border-success-subtle";
    case "Approved":
      return "bg-primary-subtle text-primary-emphasis border-primary-subtle";
    case "Initial":
    case "Pending":
      return "bg-info-subtle text-info-emphasis border-info-subtle";
    case "Cancel":
      return "bg-danger-subtle text-danger-emphasis border-danger-subtle";
    default:
      return "bg-secondary-subtle text-secondary-emphasis border-secondary-subtle";
  }
}
