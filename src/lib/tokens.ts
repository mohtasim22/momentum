import { createHash, randomBytes } from "node:crypto";

// Invite tokens. The raw token goes in the email link and is never stored;
// the database keeps only its SHA-256 hash. Someone who reads the database
// still can't build a working invite link.

/** 32 random bytes as a URL-safe string, plus the hash to store. */
export function createInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
