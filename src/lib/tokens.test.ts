import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";
import { createInviteToken, hashToken } from "./tokens";

describe("invite tokens", () => {
  it("stores a hash that matches the token, never the token itself", () => {
    const { token, tokenHash } = createInviteToken();
    expect(tokenHash).not.toBe(token);
    expect(hashToken(token)).toBe(tokenHash);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("makes URL-safe tokens that are different every time", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => createInviteToken().token));
    expect(tokens.size).toBe(100);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
});

describe("safeNextPath", () => {
  it.each(["/projects", "/invite/abc123", "/projects/x?tab=members"])("allows %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "projects", "", null, 42])(
    "rejects %s",
    (value) => {
      expect(safeNextPath(value)).toBeNull();
    },
  );
});
