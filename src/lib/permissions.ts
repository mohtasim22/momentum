import type { Role } from "@/generated/prisma/enums";

// Who may do what, as data. Read it like the role table in docs/spec.md.
// Pure: no database, no session. That makes it trivial to unit-test
// (step 2.6) and safe to import in client components to hide buttons.
const permissions = {
  "project:rename": ["OWNER", "ADMIN"],
  "project:delete": ["OWNER"],
  // Slice 3 adds task rules; Slice 5 adds the member-management rules.
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof permissions;

export function can(role: Role, action: Action): boolean {
  const allowed: readonly Role[] = permissions[action];
  return allowed.includes(role);
}
