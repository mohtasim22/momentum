import type { Metadata } from "next";
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

      <div className="rounded-lg border border-dashed p-10 text-center">
        <p className="font-medium">No projects yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Creating your first project arrives in Slice 2.</p>
      </div>
    </div>
  );
}
