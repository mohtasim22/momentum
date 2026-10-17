import type { Priority } from "@/generated/prisma/enums";

type Props = {
  title: string;
  priority: Priority;
};

// Only the priorities worth noticing get a marker. Colour means something.
const priorityMarker: Partial<Record<Priority, { label: string; className: string }>> = {
  URGENT: { label: "Urgent", className: "text-status-overdue" },
  HIGH: { label: "High", className: "text-status-progress" },
};

export function TaskCard({ title, priority }: Props) {
  const marker = priorityMarker[priority];

  return (
    <article className="grid gap-2 rounded-md border bg-card p-3 text-sm">
      <h3 className="leading-snug wrap-break-word">{title}</h3>
      {marker && (
        <p className={`font-mono text-[11px] font-semibold uppercase ${marker.className}`}>
          {marker.label}
        </p>
      )}
    </article>
  );
}
