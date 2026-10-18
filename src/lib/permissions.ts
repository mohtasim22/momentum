import type { Role } from "@/generated/prisma/enums";

// Who may do what, as data. Read it like the role table in docs/spec.md.
// Pure: no database, no session. That makes it trivial to unit-test
// (step 2.6) and safe to import in client components to hide buttons.
const permissions = {
  "project:rename": ["OWNER", "ADMIN"],
  "project:delete": ["OWNER"],
  "task:deleteAny": ["OWNER", "ADMIN"],
  // Slice 3 adds task rules; Slice 5 adds the member-management rules.
} as const satisfies Record<string, readonly Role[]>;

export type Action = keyof typeof permissions;

export function can(role: Role, action: Action): boolean {
  const allowed: readonly Role[] = permissions[action];
  return allowed.includes(role);
}

// Some rules need more than a role: they depend on who owns the thing.
// Owners and admins can delete any task; anyone can delete a task they
// created. A task whose author's account was deleted (createdById null)
// belongs to nobody, so only owners and admins can remove it.
export function canDeleteTask(role: Role, userId: string, createdById: string | null): boolean {
  return can(role, "task:deleteAny") || createdById === userId;
}
