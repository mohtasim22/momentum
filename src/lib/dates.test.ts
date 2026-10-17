import { afterEach, describe, expect, it } from "vitest";
import { dateOnlyToDate, dateToDateOnly, formatDateOnly } from "./dates";

const originalTimeZone = process.env.TZ;

afterEach(() => {
  process.env.TZ = originalTimeZone;
});

describe("date-only helpers", () => {
  it("round-trips a calendar date", () => {
    expect(dateToDateOnly(dateOnlyToDate("2026-10-20"))).toBe("2026-10-20");
  });

  it("stores midnight UTC, like a Postgres DATE", () => {
    expect(dateOnlyToDate("2026-10-20").toISOString()).toBe("2026-10-20T00:00:00.000Z");
  });

  it("formats a date for the card", () => {
    expect(formatDateOnly("2026-10-20")).toBe("20 Oct");
  });

  // The bug these helpers exist to prevent: west of UTC, midnight UTC is
  // still the previous evening, so local formatting would say "19 Oct".
  it.each(["America/Los_Angeles", "Asia/Dhaka", "Pacific/Auckland"])(
    "shows the same day in %s",
    (timeZone) => {
      process.env.TZ = timeZone;
      expect(formatDateOnly("2026-10-20")).toBe("20 Oct");
      expect(dateToDateOnly(dateOnlyToDate("2026-10-20"))).toBe("2026-10-20");
    },
  );
});
