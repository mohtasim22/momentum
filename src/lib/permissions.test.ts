import { describe, expect, it } from "vitest";
import type { Role } from "@/generated/prisma/enums";
import {
  can,
  canChangeRole,
  canDeleteTask,
  canRemoveMember,
  invitableRoles,
  wouldRemoveLastOwner,
  type Action,
} from "./permissions";

// The role table from docs/spec.md, written out by hand on purpose.
// It's typed as "every action × every role", so adding an action to
// permissions.ts or a role to the Prisma enum breaks the typecheck here
// until someone decides what the new combination should be.
const expected: Record<Action, Record<Role, boolean>> = {
  "project:rename": { OWNER: true, ADMIN: true, MEMBER: false },
  "project:delete": { OWNER: true, ADMIN: false, MEMBER: false },
  "task:deleteAny": { OWNER: true, ADMIN: true, MEMBER: false },
  "members:invite": { OWNER: true, ADMIN: true, MEMBER: false },
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

describe("invitableRoles()", () => {
  it("lets owners invite admins and members, admins invite members, members nobody", () => {
    expect(invitableRoles("OWNER")).toEqual(["ADMIN", "MEMBER"]);
    expect(invitableRoles("ADMIN")).toEqual(["MEMBER"]);
    expect(invitableRoles("MEMBER")).toEqual([]);
  });
});

describe("canChangeRole()", () => {
  it.each([
    {
      actor: "OWNER",
      from: "MEMBER",
      to: "OWNER",
      allowed: true,
      why: "owners can promote anyone",
    },
    { actor: "OWNER", from: "OWNER", to: "ADMIN", allowed: true, why: "owners can demote owners" },
    { actor: "ADMIN", from: "MEMBER", to: "ADMIN", allowed: true, why: "admins promote members" },
    { actor: "ADMIN", from: "ADMIN", to: "MEMBER", allowed: true, why: "admins demote admins" },
    {
      actor: "ADMIN",
      from: "MEMBER",
      to: "OWNER",
      allowed: false,
      why: "admins can't make owners",
    },
    {
      actor: "ADMIN",
      from: "OWNER",
      to: "ADMIN",
      allowed: false,
      why: "admins can't touch owners",
    },
    { actor: "MEMBER", from: "MEMBER", to: "ADMIN", allowed: false, why: "members change nothing" },
    {
      actor: "OWNER",
      from: "ADMIN",
      to: "ADMIN",
      allowed: false,
      why: "no-op changes are refused",
    },
  ] as const)("$actor: $from → $to is $allowed ($why)", ({ actor, from, to, allowed }) => {
    expect(canChangeRole(actor, from, to)).toBe(allowed);
  });
});

describe("canRemoveMember()", () => {
  it.each([
    { actor: "OWNER", target: "OWNER", self: false, allowed: true, why: "owners remove anyone" },
    { actor: "ADMIN", target: "MEMBER", self: false, allowed: true, why: "admins remove members" },
    { actor: "ADMIN", target: "ADMIN", self: false, allowed: false, why: "but not other admins" },
    { actor: "ADMIN", target: "OWNER", self: false, allowed: false, why: "or owners" },
    {
      actor: "MEMBER",
      target: "MEMBER",
      self: false,
      allowed: false,
      why: "members remove nobody",
    },
    { actor: "MEMBER", target: "MEMBER", self: true, allowed: true, why: "anyone can leave" },
  ] as const)(
    "$actor removing $target (self: $self) is $allowed ($why)",
    ({ actor, target, self, allowed }) => {
      expect(canRemoveMember(actor, target, self)).toBe(allowed);
    },
  );
});

describe("wouldRemoveLastOwner()", () => {
  it("blocks demoting or removing the only owner", () => {
    expect(wouldRemoveLastOwner(1, "OWNER", "ADMIN")).toBe(true);
    expect(wouldRemoveLastOwner(1, "OWNER", null)).toBe(true);
  });

  it("allows it when another owner remains", () => {
    expect(wouldRemoveLastOwner(2, "OWNER", "MEMBER")).toBe(false);
    expect(wouldRemoveLastOwner(2, "OWNER", null)).toBe(false);
  });

  it("never blocks changes to non-owners", () => {
    expect(wouldRemoveLastOwner(1, "ADMIN", null)).toBe(false);
    expect(wouldRemoveLastOwner(1, "MEMBER", "ADMIN")).toBe(false);
  });
});
