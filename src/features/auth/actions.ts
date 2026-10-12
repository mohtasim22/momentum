"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { signUpSchema, type SignUpState } from "./schemas";

export async function signUp(_prevState: SignUpState, formData: FormData): Promise<SignUpState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    // Creates the user + account (hashed password) + session.
    // nextCookies() in lib/auth.ts puts the session cookie on the response.
    await auth.api.signUpEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { formError: error.message, values };
    }
    throw error; // unexpected: let Next.js show the error page
  }

  // Outside the try: redirect() works by throwing, and the catch above
  // must not swallow it. Changes to /projects in step 1.8.
  redirect("/");
}
