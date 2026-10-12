import { FormState } from "@/lib/form-state";
import { z } from "zod";

// One schema, two users: the sign-up form checks it in the browser for
// instant feedback, and the server action checks it again because the
// browser can't be trusted.
export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80, "Keep it under 80 characters"),
  // trim and lowercase first, then check the format
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  // Better Auth's own limits are 8–128, so ours match
  password: z.string().min(8, "Use at least 8 characters").max(128, "Use 128 characters or fewer"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

// What the sign-up action sends back to the form
export type SignUpState = FormState<SignUpInput>;

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export type SignInState = FormState<SignInInput>;