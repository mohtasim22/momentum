import "server-only";

import { requireMembership } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";

// The members page: who's in the project, and who's been invited.
export async function getTeam(projectId: string) {
  const { user, role, project } = await requireMembership(projectId);

  const [memberships, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.invitation.findMany({
      where: { projectId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, expiresAt: true },
    }),
  ]);

  return {
    project,
    me: { userId: user.id, role },
    members: memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    })),
    invites: invites.map((invite) => ({ ...invite, expiresAt: invite.expiresAt.toISOString() })),
  };
}

export type TeamMember = Awaited<ReturnType<typeof getTeam>>["members"][number];

// The invite page. Public (no membership yet), so it reveals only what the
// invitee needs: the project name, who invited them, and the email it's for.
export async function getInvite(token: string) {
  const invite = await prisma.invitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      project: { select: { id: true, name: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!invite) return null;

  const usable = invite.acceptedAt === null && invite.expiresAt > new Date();
  return { ...invite, usable };
}
