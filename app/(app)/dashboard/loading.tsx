import { Skeleton } from "@/components/ui/Card";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full !rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 !rounded-2xl" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-5">
        <Skeleton className="h-72 !rounded-2xl lg:col-span-3" />
        <Skeleton className="h-72 !rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}
