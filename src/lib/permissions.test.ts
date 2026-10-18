import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/enums";
import { can, canDeleteTask, type Action } from "./permissions";

// The role table from docs/spec.md, written out by hand on purpose.
// It's typed as "every action × every role", so adding an action to
// permissions.ts or a role to the Prisma enum breaks the typecheck here
// until someone decides what the new combination should be.
const expected: Record<Action, Record<Role, boolean>> = {
  "project:rename": { OWNER: true, ADMIN: true, MEMBER: false },
  "project:delete": { OWNER: true, ADMIN: false, MEMBER: false },
  "task:deleteAny": { OWNER: true, ADMIN: true, MEMBER: false },
};

// Flatten the table into one row per (action, role) pair
const cases = Object.entries(expected).flatMap(([action, byRole]) =>
  Object.entries(byRole).map(([role, allowed]) => ({
    action: action as Action,
    role: role as Role,
    allowed,
  })),
);

describe("can()", () => {
  it.each(cases)("$role may $action: $allowed", ({ role, action, allowed }) => {
    expect(can(role, action)).toBe(allowed);
  });
});

describe("canDeleteTask()", () => {
  const me = "user-me";
  const someoneElse = "user-other";

  it.each([
    { role: "OWNER", author: someoneElse, allowed: true, why: "owners delete anything" },
    { role: "ADMIN", author: someoneElse, allowed: true, why: "admins delete anything" },
    { role: "MEMBER", author: me, allowed: true, why: "members delete their own" },
    { role: "MEMBER", author: someoneElse, allowed: false, why: "but not other people's" },
    { role: "MEMBER", author: null, allowed: false, why: "or tasks with no author" },
    { role: "OWNER", author: null, allowed: true, why: "owners can clean those up" },
  ] as const)("$role, author $author → $allowed ($why)", ({ role, author, allowed }) => {
    expect(canDeleteTask(role, me, author)).toBe(allowed);
  });
});
