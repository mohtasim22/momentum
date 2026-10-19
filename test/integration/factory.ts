import { randomUUID } from "node:crypto";
import type { Role, TaskStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { TestUser } from "./context";

// Small helpers to build a world for a test, straight in the database.

export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "rate_limit", "invitation", "task", "membership", "project", "session", "account", "verification", "user" CASCADE`,
  );
}

export async function createUser(name: string): Promise<TestUser> {
  const email = `${name.toLowerCase()}-${randomUUID().slice(0, 8)}@example.test`;
  return prisma.user.create({
    data: { id: randomUUID(), name, email },
    select: { id: true, name: true, email: true },
  });
}

export async function createProject(owner: TestUser, name: string) {
  return prisma.project.create({
    data: { name, memberships: { create: { userId: owner.id, role: "OWNER" } } },
  });
}

export async function addMember(projectId: string, user: TestUser, role: Role) {
  return prisma.membership.create({ data: { projectId, userId: user.id, role } });
}

export async function createTask(
  projectId: string,
  author: TestUser,
  title: string,
  options: { status?: TaskStatus; position?: string } = {},
) {
  return prisma.task.create({
    data: {
      projectId,
      title,
      status: options.status ?? "TODO",
      position: options.position ?? "a0",
      createdById: author.id,
    },
  });
}

/** FormData from a plain object, the way a <form> would send it */
export function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
