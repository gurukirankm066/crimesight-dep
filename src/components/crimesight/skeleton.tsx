'use client'

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/[0.04] ${className ?? ''}`}
      {...props}
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-72" />
        </div>
        <Skeleton className="h-5 w-28" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="w-7 h-7 rounded-lg" />
              <Skeleton className="w-12 h-4" />
            </div>
            <Skeleton className="h-3 w-20 mb-1.5" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-40 mb-3" />
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <Skeleton className="h-[240px] w-full rounded-full" />
            <div className="flex gap-3 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-20" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div>
        <Skeleton className="h-4 w-40 mb-3" />
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CardGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-7 w-10 mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Skeleton className="h-2.5 w-12 mb-1" />
                <Skeleton className="h-4 w-8" />
              </div>
              <div>
                <Skeleton className="h-2.5 w-10 mb-1" />
                <Skeleton className="h-4 w-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}