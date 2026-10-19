import { AsyncLocalStorage } from "node:async_hooks";

// Shared by setup.ts (the stubs) and the tests (to act as someone).

// notFound() and redirect() throw in Next.js too; here they throw errors a
// test can recognise.
export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
  }
}

export class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT ${to}`);
  }
}

// Who is "signed in". AsyncLocalStorage gives every concurrent call its own
// user, so a test can run two people's actions at the same moment.
export type TestUser = { id: string; name: string; email: string };
export const currentUser = new AsyncLocalStorage<TestUser>();

export function as<T>(user: TestUser, fn: () => Promise<T>): Promise<T> {
  return currentUser.run(user, fn);
}
