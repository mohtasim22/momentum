"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMembership } from "@/lib/authz";
import type { FormState } from "@/lib/form-state";
import { positionAfter } from "@/lib/position";
import { prisma } from "@/lib/prisma";
import { createTaskSchema, type CreateTaskInput } from "./schemas";

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

  // New tasks go to the bottom of their column: find the current last one
  const last = await prisma.task.findFirst({
    where: { projectId, status },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.task.create({
    data: {
      title,
      status,
      position: positionAfter(last?.position ?? null),
      projectId,
      createdById: user.id,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  return { ok: true };
}
