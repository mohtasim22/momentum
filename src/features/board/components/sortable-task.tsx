"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import type { BoardTask } from "../types";

type Props = {
  projectId: string;
  task: BoardTask;
};

// One draggable card. useSortable tracks where the card is being dragged
// and hands back a CSS transform that moves it on screen.
export function SortableTask({ projectId, task }: Props) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-manipulation", isDragging && "relative z-10 opacity-60")}
      {...listeners}
    >
      <TaskDialog projectId={projectId} task={task} />
    </li>
  );
}
