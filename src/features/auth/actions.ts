"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-redirect";
import { signInSchema, signUpSchema, type SignInState, type SignUpState } from "./schemas";

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
  // must not swallow it. `next` comes from links like an invite's
  // "Create account", and is only followed if it's a path on this site.
  redirect(safeNextPath(formData.get("next")) ?? "/projects");
}

export async function signIn(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const values = { email: String(formData.get("email") ?? "") };

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    if (error instanceof APIError) {
      // Better Auth says "Invalid email or password" for both a wrong
      // password and an unknown email, so attackers can't probe for accounts.
      return { formError: error.message, values };
    }
    throw error;
  }

  redirect(safeNextPath(formData.get("next")) ?? "/projects");
}

export async function signOut(formData: FormData) {
  // Deletes the session row and clears the cookie (via nextCookies()).
  await auth.api.signOut({ headers: await headers() });
  // e.g. signing out of the wrong account on an invite page brings you
  // back to it after signing in again
  const next = safeNextPath(formData.get("next"));
  redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
}
