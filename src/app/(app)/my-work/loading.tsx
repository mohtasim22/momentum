import { PageSkeleton } from "@/components/page-skeleton";

export default function MyWorkLoading() {
  return <PageSkeleton rows={5} label="Loading your tasks" />;
}
