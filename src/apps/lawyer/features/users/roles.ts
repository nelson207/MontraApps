// Montra Lawyer access: one role per user.
export const LAWYER_ROLES = ["admin", "lawyer", "assistant"] as const;
export type LawyerRole = (typeof LAWYER_ROLES)[number];

export const ROLE_LABELS: Record<LawyerRole, string> = {
  admin: "Administrator",
  lawyer: "Lawyer",
  assistant: "Assistant",
};

export const ROLE_DESCRIPTIONS: Record<LawyerRole, string> = {
  admin: "Manages users and sees every legal action",
  lawyer: "Works on the legal actions assigned to them",
  assistant: "Supports lawyers with documents and deadlines",
};

/** Lawyer's access fields on a user (the shared user management's app part) */
export type LawyerAccess = { role: LawyerRole };
