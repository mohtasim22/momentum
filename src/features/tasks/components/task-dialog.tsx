"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskCard } from "@/features/board/components/task-card";
import type { BoardTask } from "@/features/board/types";
import { DeleteTaskButton } from "./delete-task-button";
import { EditTaskForm } from "./edit-task-form";

type Props = {
  projectId: string;
  task: BoardTask;
};

// The card is the button that opens the task. Clicking, Enter and Space all
// work, because it's a real <button>.
export function TaskDialog({ projectId, task }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="block w-full rounded-md text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 hover:[&>span]:border-line-hi"
          />
        }
      >
        <TaskCard
          title={task.title}
          priority={task.priority}
          dueDate={task.dueDate}
          assigneeName={task.assignee?.name}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Changes are saved for everyone on this board.</DialogDescription>
        </DialogHeader>
        <EditTaskForm projectId={projectId} task={task} onSaved={close} />
        {task.canDelete && (
          <div className="border-t pt-4">
            <DeleteTaskButton projectId={projectId} taskId={task.id} onDeleted={close} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
