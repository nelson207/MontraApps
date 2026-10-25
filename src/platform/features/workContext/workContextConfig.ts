import type { HierarchyLevel } from "./hierarchy";
import type { HierarchySource } from "./hierarchySource";

// What an app tells the shared working context (apps/<app>/workContext.ts → WORK_CONTEXT).

export type WorkContextConfig = {
  /** How the app calls each level, e.g. Credit: Credit intermediary → Supplier → Vendor */
  levels: Record<HierarchyLevel, { label: string; plural: string }>;
  /** What a user with the "member" role is called (e.g. "salesman", "lawyer") */
  memberRole: string;
  /** What the working context is used for, under the menu title */
  purpose: string;
  /** Shown while a supervisor acts as another member */
  impersonationNote: string;
  /** Where the hierarchy comes from (the API scopes every list to the signed-in user) */
  source: HierarchySource;
  /** Development sample: names for organization i and unit j of an organization */
  sample: {
    organization: (i: number) => string;
    unit: (organizationIndex: number, j: number) => string;
  };
};
