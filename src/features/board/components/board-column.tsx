"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { AddTaskForm } from "@/features/tasks/components/add-task-form";
import type { BoardColumnData } from "../types";
import { SortableTask } from "./sortable-task";

type Props = BoardColumnData & {
  projectId: string;
};

export function BoardColumn({ projectId, status, label, badge, tasks }: Props) {
  // The whole list area is a drop target with the column's status as its id,
  // so a card can be dropped into an empty column too.
  const { setNodeRef, isOver } = useDroppable({ id: status });

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

      {/* The ids, in order, of the cards that can be sorted in this list */}
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ol
          ref={setNodeRef}
          className={cn(
            "grid min-h-16 content-start gap-2 rounded-md transition-colors",
            isOver && tasks.length === 0 && "bg-secondary",
          )}
        >
          {tasks.length === 0 && (
            <li className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              No tasks
            </li>
          )}
          {tasks.map((task) => (
            <SortableTask key={task.id} projectId={projectId} task={task} />
          ))}
        </ol>
      </SortableContext>

      <AddTaskForm projectId={projectId} status={status} columnLabel={label} />
    </section>
  );
}
