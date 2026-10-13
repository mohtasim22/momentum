import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Shown for a project that doesn't exist AND for one you're not a member of.
// The wording is deliberately the same for both.
export default function ProjectNotFound() {
  return (
    <div className="grid justify-items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">404</p>
      <p className="font-medium">Project not found</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        It may have been deleted, or you may not have access to it.
      </p>
      <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Back to your projects
      </Link>
    </div>
  );
}
