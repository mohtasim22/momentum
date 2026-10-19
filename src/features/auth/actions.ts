"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { clientIp, consumeRateLimit, LIMITS, tooManyAttempts } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-redirect";
import { DEMO_EMAIL, demoPassword } from "./demo";
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

  const requestHeaders = await headers();
  const limit = await consumeRateLimit(
    `sign-up:ip:${clientIp(requestHeaders)}`,
    LIMITS.signUpPerIp,
  );
  if (!limit.allowed) return { formError: tooManyAttempts(limit.retryAfterSeconds), values };

  try {
    // Creates the user + account (hashed password) + session.
    // nextCookies() in lib/auth.ts puts the session cookie on the response.
    await auth.api.signUpEmail({
      body: parsed.data,
      headers: requestHeaders,
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

  // Two limits: per email (guessing one person's password) and per IP
  // (trying many accounts from one machine)
  const requestHeaders = await headers();
  for (const [key, rule] of [
    [`sign-in:email:${parsed.data.email}`, LIMITS.signInPerEmail],
    [`sign-in:ip:${clientIp(requestHeaders)}`, LIMITS.signInPerIp],
  ] as const) {
    const limit = await consumeRateLimit(key, rule);
    if (!limit.allowed) return { formError: tooManyAttempts(limit.retryAfterSeconds), values };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: requestHeaders,
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

export async function signInDemo(): Promise<FormState<object>> {
  const password = demoPassword();
  if (!password) return { formError: "The demo isn't available right now." };

  const requestHeaders = await headers();
  const limit = await consumeRateLimit(
    `sign-in:ip:${clientIp(requestHeaders)}`,
    LIMITS.signInPerIp,
  );
  if (!limit.allowed) return { formError: tooManyAttempts(limit.retryAfterSeconds) };

  try {
    await auth.api.signInEmail({
      body: { email: DEMO_EMAIL, password },
      headers: requestHeaders,
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { formError: "The demo account isn't set up yet. Run the seed script." };
    }
    throw error;
  }

  redirect("/projects");
}

export async function signOut(formData: FormData) {
  // Deletes the session row and clears the cookie (via nextCookies()).
  await auth.api.signOut({ headers: await headers() });
  // e.g. signing out of the wrong account on an invite page brings you
  // back to it after signing in again
  const next = safeNextPath(formData.get("next"));
  redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in");
}
