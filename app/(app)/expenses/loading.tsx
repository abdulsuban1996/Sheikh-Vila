import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-64" />
      <Skeleton className="h-96 w-full !rounded-2xl" />
    </div>
  );
}
