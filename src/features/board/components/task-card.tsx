import type { Priority } from "@/generated/prisma/enums";
import { formatDateOnly } from "@/lib/dates";

type Props = {
  title: string;
  priority: Priority;
  dueDate: string | null;
};

// Only the priorities worth noticing get a marker. Colour means something.
const priorityMarker: Partial<Record<Priority, { label: string; className: string }>> = {
  URGENT: { label: "Urgent", className: "text-status-overdue" },
  HIGH: { label: "High", className: "text-status-progress" },
};

// Spans, not headings or paragraphs: the card sits inside a <button>,
// and a button may only contain inline ("phrasing") content.
export function TaskCard({ title, priority, dueDate }: Props) {
  const marker = priorityMarker[priority];

  return (
    // pr-9 leaves room for the drag handle in the top-right corner
    <span className="grid gap-2 rounded-md border bg-card p-3 pr-9 text-sm">
      <span className="leading-snug wrap-break-word">{title}</span>
      {(marker || dueDate) && (
        <span className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          {marker && (
            <span className={`font-semibold uppercase ${marker.className}`}>{marker.label}</span>
          )}
          {dueDate && <span className="text-muted-foreground">Due {formatDateOnly(dueDate)}</span>}
        </span>
      )}
    </span>
  );
}
