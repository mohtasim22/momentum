import { z } from "zod";
import { TaskStatus } from "@/generated/prisma/enums";

export const taskTitleSchema = z
  .string()
  .trim()
  .min(1, "Give the task a title")
  .max(200, "Keep it under 200 characters");

export const createTaskSchema = z.object({
  title: taskTitleSchema,
  // Comes from a hidden input, so the browser could send anything:
  // only the four real statuses get through.
  status: z.enum(TaskStatus, "Pick a column"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
