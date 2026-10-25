import type { UsersAccess } from "@platform/features/users/usersAccess";
import { SAMPLE_ORGANIZATIONS, sampleUnitsOf } from "@platform/features/workContext/api/sampleHierarchy";
import { rememberNodes } from "@platform/features/workContext/nodeLabels";
import CreditAccessFields from "./components/CreditAccessFields";
import {
  scopeErrors,
  scopeForLevel,
  scopeLabel,
  scopeOf,
  USER_LEVELS,
  type CreditAccess,
} from "./userLevels";

// User access for the apps on the credit network (Montra Credit, Montra Stock Credit), their part
// of the shared user management (platform/features/users):
// level A–E and the credit intermediary / supplier it's tied to.

const SCOPE_ICONS = { all: "bi-globe2", intermediary: "bi-building", supplier: "bi-shop" } as const;

export const NETWORK_USERS_ACCESS: UsersAccess<CreditAccess> = {
  // Level E: the most restricted
  empty: { level: "E", intermediary: null, supplier: null },
  Fields: CreditAccessFields,
  validate: (access) => scopeErrors(access.level, access),
  normalize: (access) => ({ level: access.level, ...scopeForLevel(access.level, access) }),
  // The API takes ids for the hierarchy
  toRequest: ({ level, intermediary, supplier }) => ({
    level,
    intermediaryId: intermediary?.id ?? null,
    supplierId: supplier?.id ?? null,
  }),
  pick: ({ level, intermediary, supplier }) => ({ level, intermediary, supplier }),
  // Names for the lazy intermediary / supplier lists
  onLoad: (user) => {
    rememberNodes("organization", [user.intermediary]);
    rememberNodes("unit", [user.supplier]);
  },
  filter: {
    param: "level",
    allLabel: "All levels",
    options: USER_LEVELS.map((level) => ({ value: level, label: `Level ${level}` })),
    matches: (user, value) => user.level === value,
  },
  columns: [
    {
      header: "Level",
      cell: (user) => (
        <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle">
          Level {user.level}
        </span>
      ),
    },
    {
      header: "Access",
      className: "d-none d-md-table-cell small",
      cell: (user) => (
        <>
          <i className={`bi ${SCOPE_ICONS[scopeOf(user.level)]} me-2 text-body-secondary`} />
          {scopeLabel(user.level, user)}
        </>
      ),
    },
  ],
  sample: (i) => {
    const level = USER_LEVELS[i % USER_LEVELS.length];
    const intermediary = SAMPLE_ORGANIZATIONS[(i * 5) % SAMPLE_ORGANIZATIONS.length];
    const supplier = sampleUnitsOf(intermediary.id)[(i * 3) % 30];
    return { level, ...scopeForLevel(level, { intermediary, supplier }) };
  },
};
