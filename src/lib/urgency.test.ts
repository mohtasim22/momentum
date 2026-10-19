import { describe, expect, it } from "vitest";
import { addDays, compareUrgency, isOverdue, urgencyBucket, type UrgencyTask } from "./urgency";

const today = "2026-10-20";
const t = (
  title: string,
  dueDate: string | null,
  priority: UrgencyTask["priority"] = "MEDIUM",
) => ({
  title,
  dueDate,
  priority,
});
const sortTitles = (tasks: UrgencyTask[]) =>
  [...tasks].sort((a, b) => compareUrgency(a, b, today)).map((task) => task.title);

describe("addDays", () => {
  it("crosses month and year ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("isOverdue", () => {
  it("is overdue only strictly before today", () => {
    expect(isOverdue("2026-10-19", today)).toBe(true);
    expect(isOverdue("2026-10-20", today)).toBe(false);
    expect(isOverdue(null, today)).toBe(false);
  });
});

describe("urgencyBucket", () => {
  it.each([
    { dueDate: "2026-10-01", bucket: 0, why: "overdue" },
    { dueDate: "2026-10-20", bucket: 1, why: "due today" },
    { dueDate: "2026-10-23", bucket: 1, why: "due in 3 days" },
    { dueDate: "2026-10-24", bucket: 2, why: "due in 4 days" },
    { dueDate: null, bucket: 3, why: "no due date" },
  ])("$dueDate → $bucket ($why)", ({ dueDate, bucket }) => {
    expect(urgencyBucket(dueDate, today)).toBe(bucket);
  });
});

describe("compareUrgency", () => {
  it("puts overdue first, then due soon, then later, then undated", () => {
    expect(
      sortTitles([
        t("later", "2026-11-15"),
        t("undated", null),
        t("soon", "2026-10-21"),
        t("overdue", "2026-10-02"),
      ]),
    ).toEqual(["overdue", "soon", "later", "undated"]);
  });

  it("breaks ties within a bucket by priority, then date, then title", () => {
    expect(
      sortTitles([
        t("b-medium", "2026-10-21", "MEDIUM"),
        t("urgent-later", "2026-10-23", "URGENT"),
        t("a-medium", "2026-10-21", "MEDIUM"),
        t("medium-earlier", "2026-10-20", "MEDIUM"),
      ]),
    ).toEqual(["urgent-later", "medium-earlier", "a-medium", "b-medium"]);
  });

  it("an urgent task with no date still comes after anything overdue", () => {
    expect(
      sortTitles([t("urgent-undated", null, "URGENT"), t("low-overdue", "2026-10-01", "LOW")]),
    ).toEqual(["low-overdue", "urgent-undated"]);
  });
});
