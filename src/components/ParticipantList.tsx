import type { Participant } from '@/types/meeting'

interface ParticipantListProps {
  participants: Participant[]
}

const responseLabel: Record<string, { label: string; className: string }> = {
  approved: {
    label: '승인',
    className: 'bg-green-50 text-green-700',
  },
  declined: {
    label: '불참',
    className: 'bg-red-50 text-red-700',
  },
  pending: {
    label: '미응답',
    className: 'bg-gray-100 text-gray-500',
  },
}

export default function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <ul className="divide-y divide-gray-100">
      {participants.map((p) => {
        const response = responseLabel[p.responseStatus]

        return (
          <li key={p.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {p.name}
              </span>
              {p.isRequired && (
                <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600">
                  필수
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 hidden sm:inline">
                {p.department} · {p.role}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${response.className}`}
              >
                {response.label}
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
