/**
 * Where to send someone after signing in, taken from a `?next=` value.
 * Only same-site paths are allowed. Without this check, a link like
 * /sign-in?next=https://evil.example would bounce a freshly signed-in user
 * to an attacker's page (an "open redirect").
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  // Must be a path on this site: "/x", not "//evil.example" or "/\evil.example"
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
