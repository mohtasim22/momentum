"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/lib/form-state";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createProjectSchema, type CreateProjectInput } from "./schemas";

type CreateProjectState = FormState<CreateProjectInput>;

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData,
): Promise<CreateProjectState> {
  // 1. Who is asking? Server Actions are public endpoints, so check first.
  const user = await requireUser();

  // 2. Is the input valid? Never trust what the browser sent.
  const parsed = createProjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { name: String(formData.get("name") ?? "") },
    };
  }

  // 3. Write. A nested create is ONE statement to Prisma: the project and
  //    the owner's membership are saved together or not at all. A project
  //    with no members would be invisible to everyone, forever.
  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      memberships: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  // 4. Tell Next.js the /projects page's data changed.
  revalidatePath("/projects");

  return { ok: true, message: `Created “${project.name}”.` };
}
