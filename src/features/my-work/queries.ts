import "server-only";

import { dateToDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// Every open task assigned to me, across all my projects. The membership
// filter is belt and braces: leaving a project already unassigns you, but
// this query never shows a task from a project you can't open.
export async function getMyWork() {
  const user = await requireUser();

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: user.id,
      status: { not: "DONE" },
      project: { memberships: { some: { userId: user.id } } },
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      project: { select: { id: true, name: true } },
    },
  });

  return tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate ? dateToDateOnly(task.dueDate) : null,
  }));
}

export type MyWorkTask = Awaited<ReturnType<typeof getMyWork>>[number];
