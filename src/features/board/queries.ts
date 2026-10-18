import "server-only";

import { requireMembership } from "@/lib/authz";
import { dateToDateOnly } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { COLUMNS } from "./columns";
import type { BoardTask } from "./types";
import { canDeleteTask } from "@/lib/permissions";

// Everything the board page needs, in one query. requireMembership runs
// first, so a non-member gets a 404 before any task is read.
export async function getBoard(projectId: string) {
  const { user, project, role } = await requireMembership(projectId);

  const rows = await prisma.task.findMany({
    where: { projectId },
    // position is COLLATE "C", so this is byte order. id breaks ties if two
    // tasks ever end up with the same key (handled properly in step 4.6).
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueDate: true,
      createdById: true,
    },
  });

// createdById is used here and then dropped: the browser only gets the answer
  const tasks: BoardTask[] = rows.map(({ createdById, ...row }) => ({
    ...row,
    dueDate: row.dueDate ? dateToDateOnly(row.dueDate) : null,
    canDelete: canDeleteTask(role, user.id, createdById),
  }));

  // Group into the four columns, keeping the order from the query
  const columns = COLUMNS.map((column) => ({
    ...column,
    tasks: tasks.filter((task) => task.status === column.status),
  }));

  return { project, role, columns };
}