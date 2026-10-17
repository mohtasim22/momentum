import type { TaskStatus } from "@/generated/prisma/enums";

// The four fixed columns, in board order. Class names are written out in
// full so Tailwind can find them (it never sees strings built at runtime).
export const COLUMNS = [
  { status: "TODO", label: "Todo", badge: "bg-status-todo-bg text-status-todo" },
  {
    status: "IN_PROGRESS",
    label: "In progress",
    badge: "bg-status-progress-bg text-status-progress",
  },
  { status: "IN_REVIEW", label: "In review", badge: "bg-status-review-bg text-status-review" },
  { status: "DONE", label: "Done", badge: "bg-status-done-bg text-status-done" },
] as const satisfies readonly { status: TaskStatus; label: string; badge: string }[];
