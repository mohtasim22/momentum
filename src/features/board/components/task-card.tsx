"use client";

import type { Priority } from "@/generated/prisma/enums";
import { useToday } from "@/hooks/use-today";
import { formatDateOnly } from "@/lib/dates";
import { isOverdue } from "@/lib/urgency";

type Props = {
  title: string;
  priority: Priority;
  dueDate: string | null;
  assigneeName?: string | null;
};

// Only the priorities worth noticing get a marker. Colour means something.
const priorityMarker: Partial<Record<Priority, { label: string; className: string }>> = {
  URGENT: { label: "Urgent", className: "text-status-overdue" },
  HIGH: { label: "High", className: "text-status-progress" },
};

// Spans, not headings or paragraphs: the card sits inside a <button>,
// and a button may only contain inline ("phrasing") content.
export function TaskCard({ title, priority, dueDate, assigneeName }: Props) {
  const marker = priorityMarker[priority];
  const today = useToday();
  const overdue = today !== null && isOverdue(dueDate, today);

  return (
    // pr-9 leaves room for the drag handle in the top-right corner
    <span className="grid gap-2 rounded-md border bg-card p-3 pr-9 text-sm">
      <span className="leading-snug wrap-break-word">{title}</span>
      {(marker || dueDate || assigneeName) && (
        <span className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          {marker && (
            <span className={`font-semibold uppercase ${marker.className}`}>{marker.label}</span>
          )}
          {dueDate && (
            <span
              className={overdue ? "font-semibold text-status-overdue" : "text-muted-foreground"}
            >
              {overdue ? "Overdue" : "Due"} {formatDateOnly(dueDate)}
            </span>
          )}
          {assigneeName && (
            <span className="ml-auto flex items-center gap-1.5 text-ink-2">
              <span
                aria-hidden="true"
                className="grid size-5 place-items-center rounded-full bg-secondary text-[10px] font-semibold"
              >
                {initials(assigneeName)}
              </span>
              <span className="sr-only">Assigned to </span>
              {assigneeName.split(" ")[0]}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}
