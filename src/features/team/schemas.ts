import { z } from "zod";
import { Role } from "@/generated/prisma/enums";

export const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  role: z.enum(Role, "Pick a role"),
});

export type InviteInput = z.infer<typeof inviteSchema>;

export const roleSchema = z.enum(Role, "Pick a role");
