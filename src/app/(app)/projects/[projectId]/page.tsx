import { Settings, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Board } from "@/features/board/components/board";
import { getBoard } from "@/features/board/queries";
import { ROLE_LABEL } from "@/features/team/roles";
import { requireMembership } from "@/lib/authz";

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
  const { project, role, columns } = await getBoard(projectId);

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <Link
          href="/projects"
          className="w-fit font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase hover:text-foreground"
        >
          ← Projects
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-xl font-semibold tracking-tight">{project.name}</h1>
            <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-xs text-ink-2">
              {ROLE_LABEL[role]}
            </span>
          </div>
          <nav aria-label="Project" className="flex items-center gap-1">
            <Link
              href={`/projects/${project.id}/members`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Users data-icon="inline-start" />
              Members
            </Link>
            <Link
              href={`/projects/${project.id}/settings`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Settings data-icon="inline-start" />
              Settings
            </Link>
          </nav>
        </div>
      </div>

      {/* Four columns: side by side on large screens, swipe sideways on phones */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <Board projectId={project.id} columns={columns} />
      </div>
    </div>
  );
}
