import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

// The current session, or null. cache() means that within one request, any
// number of layouts and pages can call this and the database is asked once.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// The security check for signed-in pages: call it at the top of every
// protected page, query and action. No valid session means /sign-in.
export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session.user;
}
