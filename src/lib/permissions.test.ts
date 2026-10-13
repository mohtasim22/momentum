import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/enums";
import { can, type Action } from "./permissions";

// The role table from docs/spec.md, written out by hand on purpose.
// It's typed as "every action × every role", so adding an action to
// permissions.ts or a role to the Prisma enum breaks the typecheck here
// until someone decides what the new combination should be.
const expected: Record<Action, Record<Role, boolean>> = {
  "project:rename": { OWNER: true, ADMIN: true, MEMBER: false },
  "project:delete": { OWNER: true, ADMIN: false, MEMBER: false },
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
