import "server-only";

import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// THE authorization rule, in one place: you can touch a project only if a
// Membership row says you belong to it. If not, the project doesn't exist
// for you, so we answer 404 (not 403), which leaks nothing.
//
// Every page, query and action that takes a projectId calls this first.
// cache() makes repeat calls with the same id free within one request.
export const requireMembership = cache(async (projectId: string) => {
  const user = await requireUser();

  // Actions receive projectId from the browser, so at runtime it could be
  // anything. Treat a non-string exactly like an unknown project.
  if (typeof projectId !== "string") {
    notFound();
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_projectId: { userId: user.id, projectId } },
    select: {
      role: true,
      project: { select: { id: true, name: true } },
    },
  });

  if (!membership) {
    notFound();
  }

  return { user, role: membership.role, project: membership.project };
});
