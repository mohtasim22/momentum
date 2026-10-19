import { createAuthClient } from "better-auth/react";

// The browser side of Better Auth. Only needed for flows that have to run in
// the browser, like the redirect to Google. Email sign-in uses Server Actions.
export const authClient = createAuthClient();
