"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import type { BoardTask } from "../types";

type Props = {
  projectId: string;
  task: BoardTask;
};

// One draggable card.
// - Mouse and touch: drag the whole card (listeners on the <li>).
// - Keyboard: focus the grip handle, press Space, move with the arrow keys,
//   press Space again to drop or Escape to cancel. setActivatorNodeRef makes
//   the handle the only element that can start a keyboard drag, so Enter on
//   the card itself still opens the task.
export function SortableTask({ projectId, task }: Props) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group relative touch-manipulation", isDragging && "opacity-40")}
      {...listeners}
    >
      <TaskDialog projectId={projectId} task={task} />
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        aria-label={`Move ${task.title}`}
        className="absolute top-2 right-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity outline-none group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <GripVertical className="size-4" />
      </button>
    </li>
  );
}
