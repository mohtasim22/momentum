import "server-only";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

// Projects the signed-in user belongs to, newest first. The query authorizes
// itself: it asks for the session first and filters by membership, so no
// caller can forget to.
export async function getMyProjects() {
  const user = await requireUser();

  const projects = await prisma.project.findMany({
    where: { memberships: { some: { userId: user.id } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      _count: { select: { memberships: true } },
      memberships: { where: { userId: user.id }, select: { role: true } },
    },
  });

  // Hand the page exactly what it shows, in a flat shape.
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    memberCount: project._count.memberships,
    myRole: project.memberships[0].role,
  }));
}
