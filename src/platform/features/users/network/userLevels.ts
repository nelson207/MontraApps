import type { HierarchyNode } from "@platform/features/workContext/hierarchy";

// Access levels and the part of the hierarchy each one is tied to:
//   A    → all credit intermediaries (nothing to choose)
//   B, C → one credit intermediary
//   D, E → one supplier (of a credit intermediary)

export const USER_LEVELS = ["A", "B", "C", "D", "E"] as const;
export type UserLevel = (typeof USER_LEVELS)[number];

export type LevelScope = "all" | "intermediary" | "supplier";

const SCOPES: Record<UserLevel, LevelScope> = {
  A: "all",
  B: "intermediary",
  C: "intermediary",
  D: "supplier",
  E: "supplier",
};

export const scopeOf = (level: UserLevel): LevelScope => SCOPES[level];

export const SCOPE_DESCRIPTIONS: Record<LevelScope, string> = {
  all: "Access to all credit intermediaries",
  intermediary: "Limited to one credit intermediary",
  supplier: "Limited to one supplier of a credit intermediary",
};

export type UserScope = {
  intermediary: HierarchyNode | null;
  supplier: HierarchyNode | null;
};

/** Drops the parts of the scope the level doesn't use (e.g. D → A clears both). */
export function scopeForLevel(level: UserLevel, scope: UserScope): UserScope {
  switch (scopeOf(level)) {
    case "all":
      return { intermediary: null, supplier: null };
    case "intermediary":
      return { intermediary: scope.intermediary, supplier: null };
    case "supplier":
      // only the scope fields: callers spread this over a whole user object
      return { intermediary: scope.intermediary, supplier: scope.supplier };
  }
}

/** What's missing for the level, or null when the scope is complete. */
export function scopeErrors(level: UserLevel, scope: UserScope) {
  const needs = scopeOf(level);
  return {
    intermediary: needs !== "all" && !scope.intermediary ? "Select a credit intermediary." : null,
    supplier: needs === "supplier" && !scope.supplier ? "Select a supplier." : null,
  };
}

/** One-line description of where a user has access, for lists. */
export function scopeLabel(level: UserLevel, scope: UserScope): string {
  switch (scopeOf(level)) {
    case "all":
      return "All credit intermediaries";
    case "intermediary":
      return scope.intermediary?.name ?? "—";
    case "supplier":
      return [scope.intermediary?.name, scope.supplier?.name].filter(Boolean).join(" › ") || "—";
  }
}

/** Credit's access fields on a user (the shared user management's app part) */
export type CreditAccess = UserScope & { level: UserLevel };
