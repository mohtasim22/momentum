import type { Priority } from "@/generated/prisma/enums";

// How "My work" orders tasks. Dates are "YYYY-MM-DD" strings, so plain
// string comparison is date comparison. `today` is the viewer's own date
// (from their browser), because "overdue" depends on where you are: at
// 1 a.m. in Dhaka it's still yesterday in London.

export type UrgencyTask = { dueDate: string | null; priority: Priority; title: string };

const DUE_SOON_DAYS = 3;
const PRIORITY_RANK: Record<Priority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

/** "2026-10-20" plus n days → "2026-10-23" (calendar maths in UTC: no DST surprises) */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate < today;
}

/** 0 overdue · 1 due within 3 days · 2 due later · 3 no due date */
export function urgencyBucket(dueDate: string | null, today: string): number {
  if (dueDate === null) return 3;
  if (dueDate < today) return 0;
  if (dueDate <= addDays(today, DUE_SOON_DAYS)) return 1;
  return 2;
}

/** For Array.sort: overdue first, then due soon, then priority, then date, then title. */
export function compareUrgency(a: UrgencyTask, b: UrgencyTask, today: string): number {
  return (
    urgencyBucket(a.dueDate, today) - urgencyBucket(b.dueDate, today) ||
    PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
    (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
    a.title.localeCompare(b.title)
  );
}
