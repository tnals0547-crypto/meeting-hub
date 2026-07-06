import Link from 'next/link'
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
      <main className="flex w-full max-w-xl flex-col px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Meeting Hub</h1>
        <p className="mt-1 text-lg font-semibold text-gray-900">
          오늘 처리해야 할 회의
        </p>
        <p className="mt-1 text-sm text-gray-500">
          우선 처리해야 하는 회의를 확인하세요.
        </p>

        <Link
          href="/meetings/new"
          className="mt-6 block rounded-2xl border border-gray-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-lg text-white">
            +
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-900">
            새 회의 만들기
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            회의를 만들고 팀원들과 시간을 조율하세요
          </p>
        </Link>

        <div className="mt-6 flex flex-col gap-3">
          {sorted.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      </main>
    </div>
  )
}
