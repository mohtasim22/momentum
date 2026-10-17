import { Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { requireMembership } from "@/lib/authz";
import { getBoard } from "@/features/board/queries";
import { BoardColumn } from "@/features/board/components/board-column";

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
              {roleLabel[role]}
            </span>
          </div>
          <Link
            href={`/projects/${project.id}/settings`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            <Settings data-icon="inline-start" />
            Settings
          </Link>
        </div>
      </div>

      {/* Four columns: side by side on large screens, swipe sideways on phones */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex gap-3 lg:grid lg:grid-cols-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.status}
              projectId={project.id}
              status={column.status}
              label={column.label}
              badge={column.badge}
              tasks={column.tasks}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
