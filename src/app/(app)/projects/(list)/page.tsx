import type { Metadata } from "next";
import Link from "next/link";
import { CreateProjectDialog } from "@/features/projects/components/create-project-dialog";
import { getMyProjects } from "@/features/projects/queries";
import { ROLE_LABEL } from "@/features/team/roles";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  // Authorizes itself (requireUser inside), so this page stays thin
  const projects = await getMyProjects();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Projects
          </p>
          <h1 className="text-xl font-semibold tracking-tight">Your projects</h1>
        </div>
        {projects.length > 0 && <CreateProjectDialog />}
      </div>

      {projects.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">No projects yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            A project is a shared board for one piece of work. Create one, then invite your team.
          </p>
          <CreateProjectDialog />
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="grid gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-line-hi hover:bg-secondary"
              >
                <span className="truncate font-medium">{project.name}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-ink-2">
                    {ROLE_LABEL[project.myRole]}
                  </span>
                  {project.memberCount} {project.memberCount === 1 ? "member" : "members"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
