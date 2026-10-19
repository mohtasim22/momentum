"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Role } from "@/generated/prisma/enums";
import { requireMembership } from "@/lib/authz";
import { sendInviteEmail } from "@/lib/email";
import type { FormState } from "@/lib/form-state";
import {
  can,
  canChangeRole,
  canRemoveMember,
  invitableRoles,
  wouldRemoveLastOwner,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { createInviteToken, hashToken } from "@/lib/tokens";
import { inviteSchema, roleSchema, type InviteInput } from "./schemas";

const INVITE_DAYS = 7;
const LAST_OWNER =
  "A project needs at least one owner. Make someone else an owner first, then try again.";

type InviteState = FormState<InviteInput> & { inviteUrl?: string };

// ─── Invites ──────────────────────────────────────────────────────

export async function inviteMember(
  projectId: string,
  _prevState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const { user, role, project } = await requireMembership(projectId);
  if (!can(role, "members:invite")) {
    return { formError: "Only owners and admins can invite people." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values: { email: String(formData.get("email") ?? "") },
    };
  }
  const { email, role: inviteRole } = parsed.data;

  if (!invitableRoles(role).includes(inviteRole)) {
    return { fieldErrors: { role: ["You can't invite people with that role."] } };
  }

  const alreadyMember = await prisma.membership.findFirst({
    where: { projectId, user: { email } },
    select: { id: true },
  });
  if (alreadyMember) {
    return { fieldErrors: { email: ["They're already in this project."] }, values: { email } };
  }

  const { token, tokenHash } = createInviteToken();
  await prisma.$transaction([
    // Re-inviting the same email replaces the old, still-pending invite
    prisma.invitation.deleteMany({ where: { projectId, email, acceptedAt: null } }),
    prisma.invitation.create({
      data: {
        email,
        role: inviteRole,
        tokenHash,
        expiresAt: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000),
        projectId,
        invitedById: user.id,
      },
    }),
  ]);

  const inviteUrl = `${process.env.BETTER_AUTH_URL}/invite/${token}`;
  const { sent } = await sendInviteEmail({
    to: email,
    inviterName: user.name,
    projectName: project.name,
    url: inviteUrl,
  });

  revalidatePath(`/projects/${projectId}/members`);
  return {
    ok: true,
    message: sent
      ? `Invite sent to ${email}.`
      : `Invite created for ${email}. Share the link below.`,
    inviteUrl,
  };
}

export async function revokeInvite(
  projectId: string,
  inviteId: string,
): Promise<{ error?: string }> {
  const { role } = await requireMembership(projectId);
  if (!can(role, "members:invite")) return { error: "Only owners and admins can revoke invites." };
  if (typeof inviteId !== "string") return { error: "That invite no longer exists." };

  // projectId in the filter: an invite id from another project deletes nothing
  await prisma.invitation.deleteMany({ where: { id: inviteId, projectId, acceptedAt: null } });

  revalidatePath(`/projects/${projectId}/members`);
  return {};
}

export async function acceptInvite(token: string): Promise<{ error?: string }> {
  const user = await requireUser();
  if (typeof token !== "string") return { error: "This invite link isn't valid." };

  const invite = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      projectId: true,
      acceptedAt: true,
      expiresAt: true,
    },
  });
  if (!invite || invite.acceptedAt || invite.expiresAt <= new Date()) {
    return { error: "This invite has expired or has already been used." };
  }
  if (invite.email !== user.email.toLowerCase()) {
    return {
      error: `This invite was sent to ${invite.email}. Sign in with that email to accept it.`,
    };
  }

  await prisma.$transaction(async (tx) => {
    // Mark it used first, and only if it's still unused: if two tabs accept
    // at once, only one of these updates matches
    const claimed = await tx.invitation.updateMany({
      where: { id: invite.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count === 0) return;

    // Already a member (e.g. invited twice)? Keep the existing role
    await tx.membership.upsert({
      where: { userId_projectId: { userId: user.id, projectId: invite.projectId } },
      create: { userId: user.id, projectId: invite.projectId, role: invite.role },
      update: {},
    });
  });

  revalidatePath("/projects");
  redirect(`/projects/${invite.projectId}`);
}

// ─── Members ──────────────────────────────────────────────────────

export async function changeRole(
  projectId: string,
  membershipId: string,
  newRole: Role,
): Promise<{ error?: string }> {
  const { role: actorRole } = await requireMembership(projectId);
  const parsedRole = roleSchema.safeParse(newRole);
  if (!parsedRole.success || typeof membershipId !== "string") {
    return { error: "That change isn't possible." };
  }
  const to = parsedRole.data;

  const error = await prisma.$transaction(async (tx) => {
    // Lock this project's owner rows until the transaction ends. A second
    // request changing owners waits here, then counts again after this one
    // commits, so two owners can't demote each other at the same moment.
    const owners = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM membership WHERE "projectId" = ${projectId} AND role = 'OWNER' FOR UPDATE`;

    const target = await tx.membership.findFirst({
      where: { id: membershipId, projectId },
      select: { id: true, role: true },
    });
    if (!target) return "That person is no longer in this project.";
    if (!canChangeRole(actorRole, target.role, to)) return "You can't make that change.";
    if (wouldRemoveLastOwner(owners.length, target.role, to)) return LAST_OWNER;

    await tx.membership.update({ where: { id: target.id }, data: { role: to } });
    return null;
  });
  if (error) return { error };

  revalidatePath(`/projects/${projectId}`, "layout");
  return {};
}

export async function removeMember(
  projectId: string,
  membershipId: string,
): Promise<{ error?: string }> {
  const { user, role: actorRole } = await requireMembership(projectId);
  if (typeof membershipId !== "string")
    return { error: "That person is no longer in this project." };

  const result = await prisma.$transaction(async (tx) => {
    const owners = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM membership WHERE "projectId" = ${projectId} AND role = 'OWNER' FOR UPDATE`;

    const target = await tx.membership.findFirst({
      where: { id: membershipId, projectId },
      select: { id: true, role: true, userId: true },
    });
    if (!target) return { error: "That person is no longer in this project." };

    const isSelf = target.userId === user.id;
    if (!canRemoveMember(actorRole, target.role, isSelf)) {
      return { error: "You can't remove that person." };
    }
    if (wouldRemoveLastOwner(owners.length, target.role, null)) {
      return { error: isSelf ? `You're the last owner. ${LAST_OWNER}` : LAST_OWNER };
    }

    await tx.membership.delete({ where: { id: target.id } });
    return { isSelf };
  });
  if ("error" in result) return { error: result.error };

  revalidatePath("/projects");
  // Left the project yourself: it's gone from your list, so go back to it
  if (result.isSelf) redirect("/projects");
  revalidatePath(`/projects/${projectId}`, "layout");
  return {};
}
