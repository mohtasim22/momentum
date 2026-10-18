import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import type { BoardColumnData } from "../types";
import { SortableTask } from "./sortable-task";

type Props = BoardColumnData & {
  projectId: string;
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
        // The ids, in order, of the cards that can be sorted in this list
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <ol className="grid gap-2">
            {tasks.map((task) => (
              <SortableTask key={task.id} projectId={projectId} task={task} />
            ))}
          </ol>
        </SortableContext>
      )}

      <AddTaskForm projectId={projectId} status={status} columnLabel={label} />
    </section>
  );
}
