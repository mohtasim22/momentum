import { z } from "zod";

// Reused by "rename project" in step 2.5
export const projectNameSchema = z
  .string()
  .trim()
  .min(1, "Give the project a name")
  .max(60, "Keep it under 60 characters");

export const createProjectSchema = z.object({
  name: projectNameSchema,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
