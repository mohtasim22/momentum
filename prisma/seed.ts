// Demo data: `npm run db:seed`. Safe to re-run: it deletes the previous demo
// users and their projects first, so it also "resets" a demo that visitors
// have rearranged.
//
// Creates a demo login (DEMO_EMAIL / DEMO_PASSWORD) who is an Admin of two
// realistic projects owned by "Maya", with teammates, assignments and due
// dates relative to today (some overdue), so every screen has something to show.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { generateNKeysBetween } from "fractional-indexing";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Priority, Role, TaskStatus } from "../src/generated/prisma/enums";

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@momentum.app";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
const TEAM_DOMAIN = "demo.momentum.app";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
if (!DEMO_PASSWORD) throw new Error("Set DEMO_PASSWORD in .env (8+ characters) before seeding.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** Today ± n days as a date-only value (midnight UTC, like a Postgres DATE) */
function day(offset: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

type SeedTask = {
  title: string;
  status: TaskStatus;
  priority?: Priority;
  due?: number;
  assignee?: string;
  description?: string;
};

async function createProject(
  name: string,
  members: { userId: string; role: Role }[],
  tasks: SeedTask[],
  people: Record<string, string>,
) {
  const project = await prisma.project.create({
    data: { name, memberships: { create: members } },
  });

  // Give each column its own run of positions, in the order listed
  const byStatus = new Map<TaskStatus, SeedTask[]>();
  for (const task of tasks) byStatus.set(task.status, [...(byStatus.get(task.status) ?? []), task]);

  for (const [status, list] of byStatus) {
    const positions = generateNKeysBetween(null, null, list.length);
    await prisma.task.createMany({
      data: list.map((task, i) => ({
        projectId: project.id,
        title: task.title,
        description: task.description ?? null,
        status,
        priority: task.priority ?? "MEDIUM",
        dueDate: task.due === undefined ? null : day(task.due),
        position: positions[i],
        assigneeId: task.assignee ? people[task.assignee] : null,
        createdById: people.maya,
      })),
    });
  }
  return project;
}

async function main() {
  // 1. Remove the previous demo (projects first: they belong to demo users)
  const oldUsers = await prisma.user.findMany({
    where: { OR: [{ email: DEMO_EMAIL }, { email: { endsWith: `@${TEAM_DOMAIN}` } }] },
    select: { id: true },
  });
  const oldIds = oldUsers.map((u) => u.id);
  await prisma.project.deleteMany({
    where: { memberships: { some: { userId: { in: oldIds }, role: "OWNER" } } },
  });
  await prisma.user.deleteMany({ where: { id: { in: oldIds } } });

  // 2. People. Only the demo visitor can sign in (has a password account).
  const people: Record<string, string> = {};
  for (const [key, name, email] of [
    ["demo", "Demo Visitor", DEMO_EMAIL],
    ["maya", "Maya Rahman", `maya@${TEAM_DOMAIN}`],
    ["arif", "Arif Khan", `arif@${TEAM_DOMAIN}`],
    ["sara", "Sara Rossi", `sara@${TEAM_DOMAIN}`],
  ] as const) {
    const user = await prisma.user.create({
      data: { id: randomUUID(), name, email, emailVerified: true },
    });
    people[key] = user.id;
  }
  await prisma.account.create({
    data: {
      id: randomUUID(),
      userId: people.demo,
      accountId: people.demo,
      providerId: "credential",
      password: await hashPassword(DEMO_PASSWORD!),
    },
  });

  // 3. Projects
  await createProject(
    "Website relaunch",
    [
      { userId: people.maya, role: "OWNER" },
      { userId: people.demo, role: "ADMIN" },
      { userId: people.arif, role: "MEMBER" },
      { userId: people.sara, role: "MEMBER" },
    ],
    [
      { title: "Write the launch announcement", status: "TODO", due: 6, assignee: "demo" },
      {
        title: "Choose a pricing page layout",
        status: "TODO",
        priority: "HIGH",
        due: 2,
        assignee: "sara",
      },
      { title: "Collect customer quotes", status: "TODO", priority: "LOW" },
      { title: "Redirect old blog URLs", status: "TODO", due: 10, assignee: "arif" },
      {
        title: "Onboarding email sequence",
        status: "IN_PROGRESS",
        priority: "URGENT",
        due: -2,
        assignee: "demo",
        description:
          "Three emails: welcome, first project, inviting the team. Copy is in the shared doc.",
      },
      {
        title: "New navigation",
        status: "IN_PROGRESS",
        priority: "HIGH",
        due: 1,
        assignee: "arif",
      },
      {
        title: "Sign-up flow redesign",
        status: "IN_REVIEW",
        priority: "HIGH",
        due: 0,
        assignee: "sara",
      },
      { title: "Cookie banner copy", status: "IN_REVIEW", assignee: "demo" },
      { title: "Set up analytics", status: "DONE", assignee: "arif" },
      { title: "Domain and DNS", status: "DONE", assignee: "maya" },
      { title: "Brand colours and type", status: "DONE", assignee: "sara" },
    ],
    people,
  );

  await createProject(
    "Mobile app beta",
    [
      { userId: people.maya, role: "OWNER" },
      { userId: people.arif, role: "ADMIN" },
      { userId: people.demo, role: "MEMBER" },
    ],
    [
      {
        title: "TestFlight build for the team",
        status: "TODO",
        priority: "HIGH",
        due: 3,
        assignee: "arif",
      },
      { title: "Beta feedback form", status: "TODO", due: -5, assignee: "demo" },
      { title: "Push notification permissions", status: "IN_PROGRESS", assignee: "arif" },
      { title: "App store screenshots", status: "IN_REVIEW", due: 8, assignee: "demo" },
      { title: "Crash reporting", status: "DONE", assignee: "arif" },
    ],
    people,
  );

  console.info(`Demo ready. Sign in as ${DEMO_EMAIL} with your DEMO_PASSWORD.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
