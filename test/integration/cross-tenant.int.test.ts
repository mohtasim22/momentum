import { beforeEach, describe, expect, it } from "vitest";
import { getBoard } from "@/features/board/queries";
import { getMyWork } from "@/features/my-work/queries";
import { deleteProject, renameProject } from "@/features/projects/actions";
import { getMyProjects } from "@/features/projects/queries";
import { createTask, deleteTask, moveTask, updateTask } from "@/features/tasks/actions";
import {
  acceptInvite,
  changeRole,
  inviteMember,
  removeMember,
  revokeInvite,
} from "@/features/team/actions";
import { getTeam } from "@/features/team/queries";
import { requireMembership } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createInviteToken } from "@/lib/tokens";
import { as, NotFoundError, RedirectError, type TestUser } from "./context";
import { createProject, createTask as seedTask, createUser, form, resetDatabase } from "./factory";

// The security audit as code. Alice owns a project; Bob owns a different
// one and is NOT a member of Alice's. Every test is Bob trying to read or
// change Alice's data, either with her ids in the URL (pages, queries) or
// by calling server actions directly with forged arguments, which is what
// an attacker with DevTools can do.

let alice: TestUser;
let bob: TestUser;
let aliceProject: { id: string; name: string };
let bobProject: { id: string };
let aliceTask: { id: string };
let bobTask: { id: string };

beforeEach(async () => {
  await resetDatabase();
  alice = await createUser("Alice");
  bob = await createUser("Bob");
  aliceProject = await createProject(alice, "Alice's launch");
  bobProject = await createProject(bob, "Bob's side project");
  aliceTask = await seedTask(aliceProject.id, alice, "Alice's secret task", { position: "a0" });
  bobTask = await seedTask(bobProject.id, bob, "Bob's task", { position: "a0" });
});

const asBob = <T>(fn: () => Promise<T>) => as(bob, fn);
const unchangedAliceTask = () => prisma.task.findUniqueOrThrow({ where: { id: aliceTask.id } });

describe("reading another team's project", () => {
  it("404s on the board, the members page and the membership check", async () => {
    await expect(asBob(() => requireMembership(aliceProject.id))).rejects.toThrow(NotFoundError);
    await expect(asBob(() => getBoard(aliceProject.id))).rejects.toThrow(NotFoundError);
    await expect(asBob(() => getTeam(aliceProject.id))).rejects.toThrow(NotFoundError);
  });

  it("treats a made-up project id exactly the same way", async () => {
    await expect(asBob(() => getBoard("does-not-exist"))).rejects.toThrow(NotFoundError);
  });

  it("never lists the project or its tasks for Bob", async () => {
    const projects = await asBob(() => getMyProjects());
    expect(projects.map((p) => p.id)).toEqual([bobProject.id]);

    // Even a task in Alice's project assigned to Bob (e.g. left over) stays hidden
    await prisma.task.update({ where: { id: aliceTask.id }, data: { assigneeId: bob.id } });
    const work = await asBob(() => getMyWork());
    expect(work.map((t) => t.id)).not.toContain(aliceTask.id);
  });

  it("sends signed-out visitors to sign in", async () => {
    await expect(requireMembership(aliceProject.id)).rejects.toThrow(RedirectError);
  });
});

describe("changing another team's project by calling actions directly", () => {
  it("can't rename or delete it", async () => {
    await expect(
      asBob(() => renameProject(aliceProject.id, {}, form({ name: "pwned" }))),
    ).rejects.toThrow(NotFoundError);
    await expect(
      asBob(() => deleteProject(aliceProject.id, {}, form({ confirmName: aliceProject.name }))),
    ).rejects.toThrow(NotFoundError);

    const project = await prisma.project.findUniqueOrThrow({ where: { id: aliceProject.id } });
    expect(project.name).toBe("Alice's launch");
  });

  it("can't add a task to it", async () => {
    await expect(
      asBob(() => createTask(aliceProject.id, {}, form({ title: "spam", status: "TODO" }))),
    ).rejects.toThrow(NotFoundError);
    expect(await prisma.task.count({ where: { projectId: aliceProject.id } })).toBe(1);
  });

  // IDOR: Bob passes his OWN project id (so the membership check passes)
  // together with Alice's task id. The task lookup is scoped to the project.
  it("can't edit, delete or move her task through his own project", async () => {
    const edit = form({
      title: "pwned",
      description: "",
      status: "DONE",
      priority: "LOW",
      dueDate: "",
      assigneeId: "",
    });
    await expect(asBob(() => updateTask(bobProject.id, aliceTask.id, {}, edit))).rejects.toThrow(
      NotFoundError,
    );
    await expect(asBob(() => deleteTask(bobProject.id, aliceTask.id))).rejects.toThrow(
      NotFoundError,
    );
    await expect(
      asBob(() =>
        moveTask(bobProject.id, {
          taskId: aliceTask.id,
          status: "DONE",
          beforeId: null,
          afterId: null,
        }),
      ),
    ).rejects.toThrow(NotFoundError);

    const task = await unchangedAliceTask();
    expect(task).toMatchObject({ title: "Alice's secret task", status: "TODO", position: "a0" });
  });

  it("can't use her task as a neighbour to steer a move", async () => {
    const result = await asBob(() =>
      moveTask(bobProject.id, {
        taskId: bobTask.id,
        status: "TODO",
        beforeId: aliceTask.id,
        afterId: null,
      }),
    );
    expect(result.error).toBeDefined();
    const task = await prisma.task.findUniqueOrThrow({ where: { id: bobTask.id } });
    expect(task.position).toBe("a0");
  });

  it("can't assign his task to someone outside his project", async () => {
    const result = await asBob(() =>
      updateTask(
        bobProject.id,
        bobTask.id,
        {},
        form({
          title: "Bob's task",
          description: "",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: "",
          assigneeId: alice.id,
        }),
      ),
    );
    expect(result.fieldErrors?.assigneeId).toBeDefined();
  });
});

describe("another team's members and invites", () => {
  it("can't invite people into it", async () => {
    await expect(
      asBob(() =>
        inviteMember(aliceProject.id, {}, form({ email: "friend@example.test", role: "MEMBER" })),
      ),
    ).rejects.toThrow(NotFoundError);
    expect(await prisma.invitation.count()).toBe(0);
  });

  it("can't revoke her invites or touch her memberships through his own project", async () => {
    const invite = await prisma.invitation.create({
      data: {
        email: "carol@example.test",
        tokenHash: createInviteToken().tokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        projectId: aliceProject.id,
        invitedById: alice.id,
      },
    });
    const aliceMembership = await prisma.membership.findFirstOrThrow({
      where: { projectId: aliceProject.id, userId: alice.id },
    });

    await asBob(() => revokeInvite(bobProject.id, invite.id));
    expect(await prisma.invitation.count({ where: { id: invite.id } })).toBe(1);

    expect(
      (await asBob(() => changeRole(bobProject.id, aliceMembership.id, "MEMBER"))).error,
    ).toBeDefined();
    expect(
      (await asBob(() => removeMember(bobProject.id, aliceMembership.id))).error,
    ).toBeDefined();
    const still = await prisma.membership.findUniqueOrThrow({ where: { id: aliceMembership.id } });
    expect(still.role).toBe("OWNER");
  });

  it("can't accept an invite that was sent to someone else", async () => {
    const { token, tokenHash } = createInviteToken();
    await prisma.invitation.create({
      data: {
        email: "carol@example.test",
        tokenHash,
        expiresAt: new Date(Date.now() + 86_400_000),
        projectId: aliceProject.id,
        invitedById: alice.id,
      },
    });
    const result = await asBob(() => acceptInvite(token));
    expect(result.error).toMatch(/sent to carol@example.test/);
    expect(await prisma.membership.count({ where: { projectId: aliceProject.id } })).toBe(1);
  });
});
