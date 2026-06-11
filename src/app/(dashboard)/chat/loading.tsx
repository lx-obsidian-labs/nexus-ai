import DashboardShell from "@/components/dashboard/shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function ChatLoading() {
  return (
    <DashboardShell>
      <div className="flex h-full">
        <div className="flex w-64 flex-col border-r p-4 space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b px-6 py-3">
            <Skeleton className="h-9 w-40" />
          </div>
          <div className="flex-1 space-y-4 p-6">
            <Skeleton className="h-20 w-3/4 ml-auto" />
            <Skeleton className="h-32 w-3/4" />
            <Skeleton className="h-24 w-2/3 ml-auto" />
          </div>
          <div className="border-t p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
