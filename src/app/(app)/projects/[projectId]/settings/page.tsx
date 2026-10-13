import type { Metadata } from "next";
import Link from "next/link";
import { DeleteProjectForm } from "@/features/projects/components/delete-project-form";
import { RenameProjectForm } from "@/features/projects/components/rename-project-form";
import { requireMembership } from "@/lib/authz";
import { can } from "@/lib/permissions";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[projectId]/settings">): Promise<Metadata> {
  const { projectId } = await params;
  const { project } = await requireMembership(projectId);
  return { title: `Settings · ${project.name}` };
}

export default async function ProjectSettingsPage({
  params,
}: PageProps<"/projects/[projectId]/settings">) {
  const { projectId } = await params;
  const { project, role } = await requireMembership(projectId);

  const canRename = can(role, "project:rename");
  const canDelete = can(role, "project:delete");

  return (
    <div className="grid max-w-2xl gap-8">
      <div className="grid gap-1">
        <Link
          href={`/projects/${project.id}`}
          className="w-fit font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase hover:text-foreground"
        >
          ← {project.name}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      </div>

      {!canRename && !canDelete && (
        <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          Only owners and admins can change this project&apos;s settings.
        </p>
      )}

      {canRename && (
        <section className="grid gap-3 rounded-lg border bg-card p-4">
          <h2 className="font-medium">General</h2>
          <RenameProjectForm projectId={project.id} currentName={project.name} />
        </section>
      )}

      {canDelete && (
        <section className="grid gap-3 rounded-lg border border-destructive/40 bg-card p-4">
          <h2 className="font-medium text-destructive">Danger zone</h2>
          <DeleteProjectForm projectId={project.id} projectName={project.name} />
        </section>
      )}
    </div>
  );
}
