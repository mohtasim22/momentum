import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

/** Show "Continue with Google" only when it's configured */
export const googleEnabled = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  // Optional. Create an OAuth client in Google Cloud with the redirect URI
  // {BETTER_AUTH_URL}/api/auth/callback/google
  socialProviders: googleEnabled
    ? { google: { clientId: googleClientId!, clientSecret: googleClientSecret! } }
    : undefined,
  plugins: [nextCookies()],
});
