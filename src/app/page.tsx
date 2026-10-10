import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const statuses = [
  { label: "Todo", className: "bg-status-todo-bg text-status-todo" },
  { label: "In progress", className: "bg-status-progress-bg text-status-progress" },
  { label: "In review", className: "bg-status-review-bg text-status-review" },
  { label: "Done", className: "bg-status-done-bg text-status-done" },
  { label: "Overdue", className: "bg-status-overdue-bg text-status-overdue" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Momentum · theme check
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          A task board for small teams.
        </h1>
        <p className="text-ink-2">
          Temporary page: confirms the Console tokens reach Tailwind and shadcn.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Status tokens
        </p>
        <ul className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <li
              key={status.label}
              className={`rounded-sm px-2 py-0.5 font-mono text-xs font-semibold ${status.className}`}
            >
              {status.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <Button>
          Create project <ArrowRight data-icon="inline-end" />
        </Button>
        <Button variant="outline">Sign in</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </main>
  );
}
