import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-28 w-full !rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 !rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 w-full !rounded-2xl" />
    </div>
  );
}
