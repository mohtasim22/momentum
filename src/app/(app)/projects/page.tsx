import type { Metadata } from "next";
import { CreateProjectForm } from "@/features/projects/components/create-project-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requireUser();

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Projects
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Welcome, {user.name}</h1>
      </div>

      <div className="max-w-xl rounded-lg border bg-card p-4">
        <CreateProjectForm />
      </div>

      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">Your projects will be listed here</p>
        <p className="mt-1 text-sm text-muted-foreground">The list arrives in step 2.3.</p>
      </div>
    </div>
  );
}
