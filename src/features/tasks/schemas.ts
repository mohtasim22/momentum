import { z } from "zod";
import { Priority, TaskStatus } from "@/generated/prisma/enums";

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Give the task a title")
  .max(200, "Keep it under 200 characters");

const taskStatusSchema = z.enum(TaskStatus, "Pick a column");

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  // Comes from a hidden input, so the browser could send anything:
  // only the four real statuses get through.
  status: taskStatusSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: taskTitleSchema,
  // An empty textarea means "no description": store null, not ""
  description: z
    .string()
    .trim()
    .max(5000, "Keep it under 5,000 characters")
    .transform((value) => (value === "" ? null : value)),
  status: taskStatusSchema,
  priority: z.enum(Priority, "Pick a priority"),
  // <input type="date"> sends "2026-10-20", or "" when cleared
  dueDate: z
    .union([z.literal(""), z.iso.date("Use a real date")])
    .transform((value) => (value === "" ? null : value)),
  // A user id, or "" for unassigned. Membership is checked in the action.
  assigneeId: z.string().transform((value) => (value === "" ? null : value)),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

// Sent by the board after a drop: which task, which column, and the cards
// now directly above and below it (null at the top or bottom).
// Never a position: the server works that out from the neighbours.
export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  status: taskStatusSchema,
  beforeId: z.string().min(1).nullable(),
  afterId: z.string().min(1).nullable(),
});

export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
