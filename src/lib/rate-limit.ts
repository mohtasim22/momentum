import "server-only";

import { prisma } from "@/lib/prisma";

// Why this exists: Better Auth rate-limits its HTTP endpoints, but our
// sign-in and sign-up are Server Actions that call auth.api directly, which
// skips that layer. Without this, passwords could be guessed endlessly.

type Limit = { max: number; windowSeconds: number };

/**
 * Count one attempt against `key`. A single SQL statement both reads and
 * increments (INSERT … ON CONFLICT DO UPDATE), so parallel requests can't
 * all slip through on a stale count.
 */
export async function consumeRateLimit(
  key: string,
  { max, windowSeconds }: Limit,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const [row] = await prisma.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO rate_limit (key, count, "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit."windowStart" < now() - ${windowSeconds} * interval '1 second' THEN 1
        ELSE rate_limit.count + 1
      END,
      "windowStart" = CASE
        WHEN rate_limit."windowStart" < now() - ${windowSeconds} * interval '1 second' THEN now()
        ELSE rate_limit."windowStart"
      END
    RETURNING count, "windowStart"`;

  const resetsAt = row.windowStart.getTime() + windowSeconds * 1000;
  return {
    allowed: row.count <= max,
    retryAfterSeconds: Math.max(1, Math.ceil((resetsAt - Date.now()) / 1000)),
  };
}

/** The visitor's IP as reported by the hosting proxy (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown"
  );
}

export function tooManyAttempts(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}

export const LIMITS = {
  signInPerEmail: { max: 5, windowSeconds: 10 * 60 },
  signInPerIp: { max: 30, windowSeconds: 10 * 60 },
  signUpPerIp: { max: 10, windowSeconds: 60 * 60 },
  invitesPerUser: { max: 30, windowSeconds: 60 * 60 },
} satisfies Record<string, Limit>;
