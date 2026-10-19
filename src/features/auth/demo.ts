import "server-only";

// The shared demo account, created by `npm run db:seed`. It's an Admin (not
// the Owner) of the demo projects, so visitors can try everything except
// deleting the projects or removing the owner. Re-seed to reset the data.
export const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@momentum.app";

export function demoPassword() {
  return process.env.DEMO_PASSWORD;
}

/** Show "Explore the demo" only when a demo password is configured. */
export function demoAvailable() {
  return Boolean(process.env.DEMO_PASSWORD);
}
