"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import type { TaskStatus } from "@/generated/prisma/enums";
import { requireMembership } from "@/lib/authz";
import { dateOnlyToDate } from "@/lib/dates";
import type { FormState } from "@/lib/form-state";
import { positionAfter } from "@/lib/position";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./schemas";

// Not exported, so not callable from the browser: just shared helpers.

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
    select: { id: true, status: true },
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
