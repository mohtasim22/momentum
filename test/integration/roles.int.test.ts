import { beforeEach, describe, expect, it } from "vitest";
import { deleteProject, renameProject } from "@/features/projects/actions";
import { deleteTask } from "@/features/tasks/actions";
import { acceptInvite, changeRole, inviteMember, removeMember } from "@/features/team/actions";
import { prisma } from "@/lib/prisma";
import { createInviteToken } from "@/lib/tokens";
import { as, RedirectError, type TestUser } from "./context";
import { addMember, createProject, createTask, createUser, form, resetDatabase } from "./factory";

// Inside one project: what each role can and can't do, enforced on the
// server even when the request is crafted by hand.

let owner: TestUser;
let admin: TestUser;
let member: TestUser;
let project: { id: string; name: string };
let ownerTask: { id: string };

const membershipOf = (user: TestUser) =>
  prisma.membership.findFirstOrThrow({ where: { projectId: project.id, userId: user.id } });
const ownerCount = () =>
  prisma.membership.count({ where: { projectId: project.id, role: "OWNER" } });

beforeEach(async () => {
  await resetDatabase();
  owner = await createUser("Olivia");
  admin = await createUser("Adam");
  member = await createUser("Mia");
  project = await createProject(owner, "Launch");
  await addMember(project.id, admin, "ADMIN");
  await addMember(project.id, member, "MEMBER");
  ownerTask = await createTask(project.id, owner, "Owner's task");
});

describe("a Member", () => {
  it("can't rename or delete the project, invite, or delete others' tasks", async () => {
    const rename = await as(member, () => renameProject(project.id, {}, form({ name: "x" })));
    expect(rename.formError).toBeDefined();

    const del = await as(member, () =>
      deleteProject(project.id, {}, form({ confirmName: project.name })),
    );
    expect(del.formError).toBeDefined();

    const invite = await as(member, () =>
      inviteMember(project.id, {}, form({ email: "x@example.test", role: "MEMBER" })),
    );
    expect(invite.formError).toBeDefined();

    expect((await as(member, () => deleteTask(project.id, ownerTask.id))).error).toBeDefined();
    expect(await prisma.task.count({ where: { id: ownerTask.id } })).toBe(1);
  });

  it("can't promote themselves", async () => {
    const mine = await membershipOf(member);
    expect((await as(member, () => changeRole(project.id, mine.id, "OWNER"))).error).toBeDefined();
    expect((await membershipOf(member)).role).toBe("MEMBER");
  });
});

describe("an Admin", () => {
  it("can invite Members but not Admins", async () => {
    const asAdmin = await as(admin, () =>
      inviteMember(project.id, {}, form({ email: "new@example.test", role: "ADMIN" })),
    );
    expect(asAdmin.fieldErrors?.role).toBeDefined();

    const asMember = await as(admin, () =>
      inviteMember(project.id, {}, form({ email: "new@example.test", role: "MEMBER" })),
    );
    expect(asMember.ok).toBe(true);
  });

  it("can't demote or remove the owner", async () => {
    const ownerMembership = await membershipOf(owner);
    expect(
      (await as(admin, () => changeRole(project.id, ownerMembership.id, "MEMBER"))).error,
    ).toBeDefined();
    expect(
      (await as(admin, () => removeMember(project.id, ownerMembership.id))).error,
    ).toBeDefined();
    expect((await membershipOf(owner)).role).toBe("OWNER");
  });

  it("can remove a member, which unassigns their tasks", async () => {
    const task = await createTask(project.id, member, "Mia's task");
    await prisma.task.update({ where: { id: task.id }, data: { assigneeId: member.id } });

    const result = await as(admin, async () =>
      removeMember(project.id, (await membershipOf(member)).id),
    );
    expect(result.error).toBeUndefined();
    const after = await prisma.task.findUniqueOrThrow({ where: { id: task.id } });
    expect(after.assigneeId).toBeNull();
  });
});

describe("the last-owner rule", () => {
  it("stops the only owner demoting themselves or leaving", async () => {
    const mine = await membershipOf(owner);
    expect((await as(owner, () => changeRole(project.id, mine.id, "ADMIN"))).error).toMatch(
      /at least one owner/,
    );
    expect((await as(owner, () => removeMember(project.id, mine.id))).error).toMatch(/last owner/);
    expect(await ownerCount()).toBe(1);
  });

  // The race the row lock exists for. Two owners each demote the other at
  // the same instant. Without the lock both would see "2 owners" and both
  // succeed, leaving zero owners. With it, the second waits, re-counts, and
  // is refused. Repeated to give the race a real chance to happen.
  it("survives two owners demoting each other at the same moment", async () => {
    const coOwner = admin;
    for (let round = 0; round < 5; round++) {
      await prisma.membership.updateMany({
        where: { projectId: project.id, userId: { in: [owner.id, coOwner.id] } },
        data: { role: "OWNER" },
      });
      const [ownerMembership, coOwnerMembership] = await Promise.all([
        membershipOf(owner),
        membershipOf(coOwner),
      ]);

      const results = await Promise.all([
        as(owner, () => changeRole(project.id, coOwnerMembership.id, "MEMBER")),
        as(coOwner, () => changeRole(project.id, ownerMembership.id, "MEMBER")),
      ]);

      expect(await ownerCount()).toBe(1);
      expect(results.filter((r) => !r.error)).toHaveLength(1);
    }
  });

  it("survives two owners leaving at the same moment", async () => {
    await prisma.membership.updateMany({
      where: { projectId: project.id, userId: admin.id },
      data: { role: "OWNER" },
    });
    const [ownerMembership, coOwnerMembership] = await Promise.all([
      membershipOf(owner),
      membershipOf(admin),
    ]);

    const results = await Promise.allSettled([
      as(owner, () => removeMember(project.id, ownerMembership.id)),
      as(admin, () => removeMember(project.id, coOwnerMembership.id)),
    ]);

    // Leaving yourself ends in a redirect (a thrown RedirectError) on success
    const left = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof RedirectError,
    );
    expect(left).toHaveLength(1);
    expect(await ownerCount()).toBe(1);
  });
});

describe("invites", () => {
  it("can only be used once, even when accepted twice at the same moment", async () => {
    const invitee = await createUser("Ivy");
    const { token, tokenHash } = createInviteToken();
    await prisma.invitation.create({
      data: {
        email: invitee.email,
        tokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        projectId: project.id,
        invitedById: owner.id,
      },
    });

    await Promise.allSettled([
      as(invitee, () => acceptInvite(token)),
      as(invitee, () => acceptInvite(token)),
    ]);

    expect(
      await prisma.membership.count({ where: { projectId: project.id, userId: invitee.id } }),
    ).toBe(1);
    const again = await as(invitee, () => acceptInvite(token));
    expect(again.error).toMatch(/expired or has already been used/);
  });

  it("refuses expired invites", async () => {
    const invitee = await createUser("Ivy");
    const { token, tokenHash } = createInviteToken();
    await prisma.invitation.create({
      data: {
        email: invitee.email,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000),
        projectId: project.id,
        invitedById: owner.id,
      },
    });
    expect((await as(invitee, () => acceptInvite(token))).error).toMatch(/expired/);
  });
});
