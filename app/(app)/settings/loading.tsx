import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 w-full !rounded-2xl" />
      <Skeleton className="h-72 w-full !rounded-2xl" />
    </div>
  );
}
