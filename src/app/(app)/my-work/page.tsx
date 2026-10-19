import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { MyWorkList } from "@/features/my-work/components/my-work-list";
import { getMyWork } from "@/features/my-work/queries";

export const metadata: Metadata = { title: "My work" };

export default async function MyWorkPage() {
  // Authorizes itself (requireUser inside)
  const tasks = await getMyWork();

  return (
    <div className="grid max-w-4xl gap-6">
      <div className="grid gap-1">
        <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          My work
        </p>
        <h1 className="text-xl font-semibold tracking-tight">Assigned to you</h1>
        <p className="text-sm text-muted-foreground">
          Open tasks from all your projects, most urgent first.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
          <p className="font-medium">Nothing assigned to you</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When someone assigns you a task, or you assign one to yourself from its card, it shows
            up here.
          </p>
          <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Go to your projects
          </Link>
        </div>
      ) : (
        <MyWorkList tasks={tasks} />
      )}
    </div>
  );
}
