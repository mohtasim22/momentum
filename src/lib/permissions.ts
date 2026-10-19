import type { Role } from "@/generated/prisma/enums";

// Who may do what, as data. Read it like the role table in docs/spec.md.
// Pure: no database, no session. That makes it trivial to unit-test
// and safe to import in client components to hide buttons.
const permissions = {
  "project:rename": ["OWNER", "ADMIN"],
  "project:delete": ["OWNER"],
  "task:deleteAny": ["OWNER", "ADMIN"],
  "members:invite": ["OWNER", "ADMIN"],
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

// ─── Team management ──────────────────────────────────────────────
// Rules that compare two roles: the person acting, and the person (or
// invite) being acted on. Admins manage members; owners manage everyone.

/** The roles this person may hand out in an invite. Nobody is invited straight in as Owner. */
export function invitableRoles(actor: Role): Role[] {
  if (actor === "OWNER") return ["ADMIN", "MEMBER"];
  if (actor === "ADMIN") return ["MEMBER"];
  return [];
}

/** Can `actor` change someone from `from` to `to`? (Not counting the last-owner rule.) */
export function canChangeRole(actor: Role, from: Role, to: Role): boolean {
  if (from === to) return false;
  if (actor === "OWNER") return true;
  // Admins move people between Member and Admin, and never touch owners
  if (actor === "ADMIN") return from !== "OWNER" && to !== "OWNER";
  return false;
}

/** Can `actor` remove someone with role `target`? Removing yourself is leaving. */
export function canRemoveMember(actor: Role, target: Role, isSelf: boolean): boolean {
  if (isSelf) return true;
  if (actor === "OWNER") return true;
  if (actor === "ADMIN") return target === "MEMBER";
  return false;
}

/**
 * The invariant: a project always has at least one owner. Would this change
 * (`to` is the new role, or null for removal) take away the last one?
 * The caller must count owners inside the same transaction, with the owner
 * rows locked, or two owners demoting each other at once could both pass.
 */
export function wouldRemoveLastOwner(ownerCount: number, from: Role, to: Role | null): boolean {
  return from === "OWNER" && to !== "OWNER" && ownerCount <= 1;
}
