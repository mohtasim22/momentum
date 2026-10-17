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
import { EditTaskForm } from "./edit-task-form";

type Props = {
  projectId: string;
  task: BoardTask;
};

// The card is the button that opens the task. Clicking, Enter and Space all
// work, because it's a real <button>.
export function TaskDialog({ projectId, task }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button
            type="button"
            className="block w-full rounded-md text-left transition-colors outline-none hover:[&>span]:border-line-hi focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <TaskCard title={task.title} priority={task.priority} dueDate={task.dueDate} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Changes are saved for everyone on this board.</DialogDescription>
        </DialogHeader>
        <EditTaskForm projectId={projectId} task={task} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
