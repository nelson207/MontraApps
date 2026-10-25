import type { ComponentType, ReactNode } from "react";

// User management is shared by every Montra app; what a user can access is app-specific.
// Each app describes its "access" part in apps/<app>/users.tsx (USERS_ACCESS), e.g. Credit:
// level A–E + credit intermediary / supplier; Lawyer: a role.

/** The fields every Montra user has */
export type BaseUser = {
  /** The API's opaque id (a string token): compare and send back as is */
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  active: boolean;
};

/** A user: base fields + the app's access fields (flat, as the API sends them) */
export type AdminUser<A extends object> = BaseUser & A;
export type UserInput<A extends object> = Omit<AdminUser<A>, "id">;

export type AccessErrors = Record<string, string | null>;

export type AccessColumn<A extends object> = {
  header: string;
  cell: (user: AdminUser<A>) => ReactNode;
  /** Bootstrap classes for both th and td, e.g. "d-none d-md-table-cell" */
  className?: string;
};

export type UsersAccess<A extends object> = {
  /** Access of a new user (usually the most restricted) */
  empty: A;
  /** The "Access" card of the user form (Active is added by the platform) */
  Fields: ComponentType<{ value: A; onChange: (next: A) => void; errors: AccessErrors }>;
  /** What's missing or wrong; shown by Fields after the first submit */
  validate: (access: A) => AccessErrors;
  /** Drops what doesn't apply before saving (e.g. Credit level A clears the scope) */
  normalize?: (access: A) => A;
  /** API body for the access part (e.g. node objects → ids) */
  toRequest?: (access: A) => object;
  /** The access fields of a loaded user */
  pick: (user: AdminUser<A>) => A;
  /** Called with a loaded user before editing (e.g. remember names for lazy lists) */
  onLoad?: (user: AdminUser<A>) => void;
  /** List filter: query parameter, its options and the dev-sample predicate */
  filter: {
    param: string;
    allLabel: string;
    options: { value: string; label: string }[];
    matches: (user: AdminUser<A>, value: string) => boolean;
  };
  /** Extra list columns between "User" and "Status" */
  columns: AccessColumn<A>[];
  /** Dev sample data: the access of sample user i */
  sample: (i: number) => A;
};
