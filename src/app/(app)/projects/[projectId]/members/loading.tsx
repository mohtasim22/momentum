import { PageSkeleton } from "@/components/page-skeleton";

export default function MembersLoading() {
  return <PageSkeleton rows={3} label="Loading members" />;
}
