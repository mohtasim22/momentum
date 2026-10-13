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

export const renameProjectSchema = z.object({
  name: projectNameSchema,
});

export type RenameProjectInput = z.infer<typeof renameProjectSchema>;

// The real check (does it match the project's name?) happens on the server,
// against the name in the database.
export const deleteProjectSchema = z.object({
  confirmName: z.string().trim().min(1, "Type the project name to confirm"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
