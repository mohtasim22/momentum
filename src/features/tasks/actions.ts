"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { TaskStatus } from "@/generated/prisma/enums";
import { requireMembership } from "@/lib/authz";
import { dateOnlyToDate } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";
import { canDeleteTask } from "@/lib/permissions";
import {
  freshPositions,
  hasRoomBetween,
  orderWithInsert,
  positionAfter,
  positionBetween,
} from "@/lib/position";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type MoveTaskInput,
  type UpdateTaskInput,
} from "./schemas";

// Not exported, so not callable from the browser: just shared helpers.

/** Re-key a whole column in order, inserting `taskId` right after `beforeId`. */
async function rebalanceColumn(
  projectId: string,
  status: TaskStatus,
  taskId: string,
  beforeId: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const column = await tx.task.findMany({
      where: { projectId, status, id: { not: taskId } },
      orderBy: [{ position: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const order = orderWithInsert(
      column.map((t) => t.id),
      taskId,
      beforeId,
    );
    const keys = freshPositions(order.length);
    for (const [index, id] of order.entries()) {
      await tx.task.update({
        where: { id },
        data: { position: keys[index], ...(id === taskId && { status }) },
      });
    }
  });
}

/** The next position at the bottom of a column. */
async function bottomOfColumn(projectId: string, status: TaskStatus) {
  const last = await prisma.task.findFirst({
    where: { projectId, status },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return positionAfter(last?.position ?? null);
}

/**
 * The task, but only if it belongs to this project. Looking it up by id
 * alone would let a member of project A edit project B's tasks by sending
 * B's task id (an IDOR). Call requireMembership(projectId) first.
 */
async function findTaskInProject(projectId: string, taskId: string) {
  if (typeof taskId !== "string") notFound();
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, status: true, createdById: true },
  });
  if (!task) notFound();
  return task;
}

export async function createTask(
  projectId: string,
  _prevState: FormState<CreateTaskInput>,
  formData: FormData,
): Promise<FormState<CreateTaskInput>> {
  // Any member can add tasks, so membership is the whole check
  const { user } = await requireMembership(projectId);

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { title: String(formData.get("title") ?? "") },
    };
  }
  const { title, status } = parsed.data;

  await prisma.task.create({
    data: {
      title,
      status,
      position: await bottomOfColumn(projectId, status),
      projectId,
      createdById: user.id,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

export async function updateTask(
  projectId: string,
  taskId: string,
  _prevState: FormState<UpdateTaskInput>,
  formData: FormData,
): Promise<FormState<UpdateTaskInput>> {
  // Any member can edit any task in their project
  await requireMembership(projectId);
  const task = await findTaskInProject(projectId, taskId);

  const raw = {
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    priority: formData.get("priority"),
    dueDate: formData.get("dueDate"),
  };
  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: {
        title: String(raw.title ?? ""),
        description: String(raw.description ?? ""),
        status: String(raw.status ?? ""),
        priority: String(raw.priority ?? ""),
        dueDate: String(raw.dueDate ?? ""),
      },
    };
  }
  const { title, description, status, priority, dueDate } = parsed.data;

  await prisma.task.update({
    where: { id: task.id },
    data: {
      title,
      description,
      priority,
      status,
      dueDate: dueDate ? dateOnlyToDate(dueDate) : null,
      // Moved to another column from the form? Put it at the bottom there.
      ...(status !== task.status && { position: await bottomOfColumn(projectId, status) }),
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}

// Called from a button, not a form, so it takes plain arguments and returns
// a plain result instead of FormState.
export async function deleteTask(projectId: string, taskId: string): Promise<{ error?: string }> {
  const { user, role } = await requireMembership(projectId);
  const task = await findTaskInProject(projectId, taskId);

  if (!canDeleteTask(role, user.id, task.createdById)) {
    return { error: "Only owners, admins and the person who created a task can delete it." };
  }

  await prisma.task.delete({ where: { id: task.id } });

  revalidatePath(`/projects/${projectId}`);
  return {};
}

const BOARD_CHANGED =
  "Someone changed the board while you were dragging. It has been refreshed, so try again.";

// Called by the board after a drop. The client says where the card landed
// (column + neighbour ids); the server checks that picture against the
// database and computes the position itself.
export async function moveTask(
  projectId: string,
  input: MoveTaskInput,
): Promise<{ error?: string }> {
  // 1. Member of this project?
  await requireMembership(projectId);

  // 2. Is the input the right shape?
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { error: BOARD_CHANGED };
  const { taskId, status, beforeId, afterId } = parsed.data;

  // 3. The task must belong to this project (IDOR)
  const task = await findTaskInProject(projectId, taskId);

  // 4. The neighbours must exist, belong to this project, and be in the
  //    target column. The projectId filter means another team's task ids
  //    simply aren't found.
  const neighbourIds = [beforeId, afterId].filter((id): id is string => id !== null);
  if (neighbourIds.includes(task.id)) return { error: BOARD_CHANGED };

  const neighbours = await prisma.task.findMany({
    where: { projectId, id: { in: neighbourIds } },
    select: { id: true, status: true, position: true },
  });
  const before = neighbours.find((n) => n.id === beforeId);
  const after = neighbours.find((n) => n.id === afterId);
  if ((beforeId && before?.status !== status) || (afterId && after?.status !== status)) {
    return { error: BOARD_CHANGED };
  }

  const beforePosition = before?.position ?? null;
  const afterPosition = after?.position ?? null;

  if (hasRoomBetween(beforePosition, afterPosition)) {
    // 5. The normal case: one new key between the neighbours, one row changes
    const position =
      before || after
        ? positionBetween(beforePosition, afterPosition)
        : await bottomOfColumn(projectId, status);
    await prisma.task.update({ where: { id: task.id }, data: { status, position } });
  } else {
    // 5b. The neighbours share a position (two tasks were added to this
    //     column at the same moment), so no key fits between them. Give the
    //     whole column fresh, evenly spaced keys in one transaction, with the
    //     moved task right after `before`. Rare, and it repairs the tie for good.
    await rebalanceColumn(projectId, status, task.id, before?.id ?? null);
  }

  revalidatePath(`/projects/${projectId}`);
  return {};
}
