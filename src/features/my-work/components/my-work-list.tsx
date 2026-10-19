"use client";

import Link from "next/link";
import { COLUMNS } from "@/features/board/columns";
import { useToday } from "@/hooks/use-today";
import { cn } from "@/lib/utils";
import { formatDateOnly } from "@/lib/dates";
import { compareUrgency, isOverdue } from "@/lib/urgency";
import type { MyWorkTask } from "../queries";

const STATUS = Object.fromEntries(COLUMNS.map((column) => [column.status, column]));

export function MyWorkList({ tasks }: { tasks: MyWorkTask[] }) {
  const today = useToday();
  // Without a date yet, sort as if today were far in the past: by due date
  const sorted = [...tasks].sort((a, b) => compareUrgency(a, b, today ?? "0000-01-01"));
  const overdueCount = today ? tasks.filter((task) => isOverdue(task.dueDate, today)).length : 0;

  return (
    <div className="grid gap-3">
      {overdueCount > 0 && (
        <p className="rounded-md border border-destructive/40 bg-status-overdue-bg px-3 py-2 text-sm text-status-overdue">
          {overdueCount} {overdueCount === 1 ? "task is" : "tasks are"} overdue.
        </p>
      )}
      <ul className="divide-y rounded-lg border bg-card">
        {sorted.map((task) => {
          const overdue = today !== null && isOverdue(task.dueDate, today);
          const column = STATUS[task.status];
          return (
            <li key={task.id}>
              <Link
                href={`/projects/${task.project.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-secondary"
              >
                <span className="min-w-0 flex-1 basis-60">
                  <span className="block truncate font-medium">{task.title}</span>
                  <span className="block truncate font-mono text-xs text-muted-foreground">
                    {task.project.name}
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-sm px-2 py-0.5 font-mono text-[11px] font-semibold uppercase",
                    column.badge,
                  )}
                >
                  {column.label}
                </span>
                {task.priority === "URGENT" || task.priority === "HIGH" ? (
                  <span
                    className={cn(
                      "font-mono text-[11px] font-semibold uppercase",
                      task.priority === "URGENT" ? "text-status-overdue" : "text-status-progress",
                    )}
                  >
                    {task.priority === "URGENT" ? "Urgent" : "High"}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "w-28 text-right font-mono text-xs tabular-nums",
                    overdue ? "font-semibold text-status-overdue" : "text-muted-foreground",
                  )}
                >
                  {task.dueDate
                    ? `${overdue ? "Overdue · " : "Due "}${formatDateOnly(task.dueDate)}`
                    : "No due date"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
