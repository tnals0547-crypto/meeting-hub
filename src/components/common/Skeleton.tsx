interface SkeletonProps {
  className?: string
  count?: number
  height?: string
}

export function SkeletonLine({ className = '', height = 'h-4' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${height} ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="h-6 w-20 rounded-full bg-gray-200" />
        <div className="h-6 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mt-4 h-5 w-3/4 rounded-md bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded-md bg-gray-200" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-16 rounded-md bg-gray-200" />
        <div className="h-6 w-16 rounded-md bg-gray-200" />
        <div className="h-6 w-16 rounded-md bg-gray-200" />
      </div>
      <div className="mt-4 h-11 w-full rounded-[8px] bg-gray-200" />
    </div>
  )
}

export function SkeletonParticipantList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 animate-pulse">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-24 rounded-md bg-gray-200" />
            <div className="h-3 w-36 rounded-md bg-gray-200" />
          </div>
          <div className="h-6 w-14 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  )
}

export function SchedulerSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200" />
          <div className="flex flex-col gap-1">
            <div className="h-4 w-20 rounded-md bg-gray-200" />
            <div className="h-3 w-12 rounded-md bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  )
}