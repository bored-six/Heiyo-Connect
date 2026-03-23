import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-12" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="divide-y">
          {/* Table header */}
          <div className="bg-muted/50 px-4 py-3 grid grid-cols-7 gap-4">
            {["Subject", "Customer", "Status", "Priority", "Msgs", "Created", "Actions"].map((col) => (
              <Skeleton key={col} className="h-4 w-full max-w-[80px]" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-4 py-3 grid grid-cols-7 gap-4 items-center">
              <Skeleton className="h-4 w-full col-span-1" />
              <div className="space-y-1 col-span-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-20" />
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
