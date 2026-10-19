import { requireMembership } from "@/lib/authz";

// Runs the membership check for every page under /projects/[id] BEFORE their
// loading skeletons start streaming. A notFound() after streaming has begun
// can only send a 200 status; here, outsiders still get a real 404.
// (Each page still calls requireMembership itself: layouts don't re-run on
// client-side navigation, so this is not the security check. It's free
// anyway, because React cache() makes the second call a lookup.)
export default async function ProjectLayout({
  children,
  params,
}: LayoutProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  await requireMembership(projectId);
  return children;
}
