import type { Metadata } from "next";
import Link from "next/link";
import { requireMembership } from "@/lib/authz";

const roleLabel = { OWNER: "Owner", ADMIN: "Admin", MEMBER: "Member" } as const;

// The tab title shows the project name, so it must pass the same check.
// Otherwise a stranger's 404 page would leak the name in the browser tab.
export async function generateMetadata({
  params,
}: PageProps<"/projects/[projectId]">): Promise<Metadata> {
  const { projectId } = await params;
  const { project } = await requireMembership(projectId);
  return { title: project.name };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const { project, role } = await requireMembership(projectId);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <Link
          href="/projects"
          className="w-fit font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          ← Projects
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
          <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-ink-2">
            {roleLabel[role]}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">The board goes here</p>
        <p className="mt-1 text-sm text-muted-foreground">Columns and tasks arrive in Slice 3.</p>
      </div>
    </div>
  );
}
