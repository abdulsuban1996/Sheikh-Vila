import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-80 w-full !rounded-2xl" />
    </div>
  );
}
