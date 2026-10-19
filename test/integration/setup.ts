import "dotenv/config";
import { vi } from "vitest";

// Runs in each test file before the code under test is imported, so the
// Prisma client (which reads DATABASE_URL when it's created) connects to the
// test database, never the dev one.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";

// ─── Next.js request layer stubs ──────────────────────────────────
// (vi.mock is hoisted above imports, so each factory imports what it needs)
vi.mock("next/navigation", async () => {
  const { NotFoundError, RedirectError } = await import("./context");
  return {
    notFound: () => {
      throw new NotFoundError();
    },
    redirect: (to: string) => {
      throw new RedirectError(to);
    },
  };
});
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

// The session is whoever the test is acting as (see `as()` in context.ts)
vi.mock("@/lib/session", async () => {
  const { currentUser, RedirectError } = await import("./context");
  return {
    getSession: async () => {
      const user = currentUser.getStore();
      return user ? { user, session: { id: "test-session" } } : null;
    },
    requireUser: async () => {
      const user = currentUser.getStore();
      if (!user) throw new RedirectError("/sign-in");
      return user;
    },
  };
});
