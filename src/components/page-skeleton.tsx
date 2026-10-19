import { Skeleton } from "@/components/ui/skeleton";

// A generic "heading + list" skeleton for pages that are mostly a list
export function PageSkeleton({ rows = 4, label }: { rows?: number; label: string }) {
  return (
    <div className="grid max-w-3xl gap-6" aria-busy="true" aria-label={label}>
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 bg-card px-4 py-3">
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
