import type { TaskStatus } from "@/generated/prisma/enums";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import type { BoardTask } from "../types";

type Props = {
  projectId: string;
  status: TaskStatus;
  label: string;
  badge: string;
  tasks: BoardTask[];
};

export function BoardColumn({ projectId, status, label, badge, tasks }: Props) {
  return (
    <section
      aria-labelledby={`column-${status}`}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-lg border bg-background/40 p-3 lg:w-auto"
    >
      <header className="flex items-center justify-between gap-2">
        <h2
          id={`column-${status}`}
          className={`rounded-sm px-2 py-0.5 font-mono text-[11px] font-semibold tracking-widest uppercase ${badge}`}
        >
          {label}
        </h2>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">{tasks.length}</span>
      </header>

      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          No tasks
        </p>
      ) : (
        <ol className="grid gap-2">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskDialog projectId={projectId} task={task} />
            </li>
          ))}
        </ol>
      )}

      <AddTaskForm projectId={projectId} status={status} columnLabel={label} />
    </section>
  );
}
