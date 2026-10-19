import { beforeEach, describe, expect, it } from "vitest";
import { signIn } from "@/features/auth/actions";
import { prisma } from "@/lib/prisma";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { form, resetDatabase } from "./factory";

beforeEach(resetDatabase);

describe("consumeRateLimit", () => {
  it("allows `max` attempts per window, then refuses", async () => {
    const rule = { max: 3, windowSeconds: 60 };
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await consumeRateLimit("k", rule)).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it("can't be beaten by sending many requests at once", async () => {
    const rule = { max: 5, windowSeconds: 60 };
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeRateLimit("burst", rule)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("starts counting again once the window has passed", async () => {
    const rule = { max: 1, windowSeconds: 60 };
    await consumeRateLimit("old", rule);
    expect((await consumeRateLimit("old", rule)).allowed).toBe(false);
    await prisma.rateLimit.update({
      where: { key: "old" },
      data: { windowStart: new Date(Date.now() - 61_000) },
    });
    expect((await consumeRateLimit("old", rule)).allowed).toBe(true);
  });
});

describe("sign-in brute force", () => {
  it("locks an email out after 5 failed attempts", async () => {
    const attempt = () =>
      signIn({}, form({ email: "victim@example.test", password: "guess-123456" }));
    const errors = [];
    for (let i = 0; i < 6; i++) errors.push((await attempt()).formError);
    expect(errors.slice(0, 5).every((e) => e === "Invalid email or password")).toBe(true);
    expect(errors[5]).toMatch(/Too many attempts/);
  });
});

describe("clientIp", () => {
  it("takes the first address from x-forwarded-for", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe(
      "203.0.113.7",
    );
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
