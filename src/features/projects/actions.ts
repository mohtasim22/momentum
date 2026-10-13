"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMembership } from "@/lib/authz";
import type { FormState } from "@/lib/form-state";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  createProjectSchema,
  deleteProjectSchema,
  renameProjectSchema,
  type CreateProjectInput,
  type DeleteProjectInput,
  type RenameProjectInput,
} from "./schemas";

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

// projectId arrives through .bind() in the form. Bound arguments come from
// the browser like everything else, so requireMembership checks it again.
export async function renameProject(
  projectId: string,
  _prevState: FormState<RenameProjectInput>,
  formData: FormData,
): Promise<FormState<RenameProjectInput>> {
  // 1. Member of this project? (404 if not)  2. Allowed to rename?
  const { role } = await requireMembership(projectId);
  if (!can(role, "project:rename")) {
    return { formError: "Only owners and admins can rename this project." };
  }

  const parsed = renameProjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { name: String(formData.get("name") ?? "") },
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { name: parsed.data.name },
  });

  // "layout" refreshes this project's page AND everything under it (settings)
  revalidatePath(`/projects/${projectId}`, "layout");
  revalidatePath("/projects");

  return { ok: true, message: "Saved." };
}

export async function deleteProject(
  projectId: string,
  _prevState: FormState<DeleteProjectInput>,
  formData: FormData,
): Promise<FormState<DeleteProjectInput>> {
  const { role, project } = await requireMembership(projectId);
  if (!can(role, "project:delete")) {
    return { formError: "Only the owner can delete this project." };
  }

  const parsed = deleteProjectSchema.safeParse({ confirmName: formData.get("confirmName") });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (parsed.data.confirmName !== project.name) {
    return { fieldErrors: { confirmName: ["That doesn't match the project name"] } };
  }

  // Memberships go with it (onDelete: Cascade); tasks will too, in Slice 3.
  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/projects");
  redirect("/projects");
}
