import type { Priority, TaskStatus } from "@/generated/prisma/enums";

// What the board sends to the browser for each task. dueDate is a plain
// "2026-10-20" string: a calendar date with no time zone to get wrong.
export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  canDelete: boolean;
};

// One column as the board component receives it
export type BoardColumnData = {
  status: TaskStatus;
  label: string;
  badge: string;
  tasks: BoardTask[];
};
