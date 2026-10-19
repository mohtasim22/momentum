import { Skeleton } from "@/components/ui/skeleton";

// Shown while the board loads: the same shape as the real thing, so nothing
// jumps when it arrives
export default function BoardLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading the board">
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-56" />
      </div>
      <div className="flex gap-3 overflow-hidden lg:grid lg:grid-cols-4">
        {[3, 2, 1, 2].map((cards, column) => (
          <div
            key={column}
            className="grid w-72 shrink-0 content-start gap-3 rounded-lg border p-3 lg:w-auto"
          >
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: cards }, (_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
