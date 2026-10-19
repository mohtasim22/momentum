import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading your projects">
      <div className="grid gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-44" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="grid gap-3 rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
