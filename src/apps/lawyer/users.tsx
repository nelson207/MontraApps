import type { UsersAccess } from "@platform/features/users/usersAccess";
import RoleFields from "./features/users/components/RoleFields";
import { LAWYER_ROLES, ROLE_LABELS, type LawyerAccess } from "./features/users/roles";

// Montra Lawyer's part of the shared user management (platform/features/users): a role.

export const USERS_ACCESS: UsersAccess<LawyerAccess> = {
  // Assistant: the most restricted
  empty: { role: "assistant" },
  Fields: RoleFields,
  validate: ({ role }) => ({ role: LAWYER_ROLES.includes(role) ? null : "Select a role." }),
  pick: ({ role }) => ({ role }),
  filter: {
    param: "role",
    allLabel: "All roles",
    options: LAWYER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
    matches: (user, value) => user.role === value,
  },
  columns: [
    {
      header: "Role",
      cell: (user) => (
        <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis border border-primary-subtle">
          {ROLE_LABELS[user.role]}
        </span>
      ),
    },
  ],
  sample: (i) => ({ role: LAWYER_ROLES[i % LAWYER_ROLES.length] }),
};
