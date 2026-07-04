import { meetings } from '@/data/mock'
import MeetingCard from '@/components/MeetingCard'

const statusPriority: Record<string, number> = {
  response_complete: 0,
  response_collecting: 1,
  pending: 2,
  confirmed: 3,
}

export default function Home() {
  const sorted = [...meetings].sort(
    (a, b) => (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9),
  )

  return (
    <div className="flex flex-col items-center bg-zinc-50 min-h-full">
      <main className="flex w-full max-w-xl flex-col px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Hub</h1>
        <p className="mt-1 text-lg font-semibold text-gray-900">
          오늘 처리해야 할 회의
        </p>
        <p className="mt-1 text-sm text-gray-500">
          우선 처리해야 하는 회의를 확인하세요.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {sorted.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </main>
    </div>
  )
}
