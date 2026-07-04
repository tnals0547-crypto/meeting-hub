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
    <div className="flex flex-col gap-2">
      {participants.map((p) => {
        const response = responseLabel[p.responseStatus]

        return (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
          >
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {p.name}
                </span>
                {p.isRequired && (
                  <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-600">
                    필수
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 truncate">
                {p.department} · {p.role}
              </span>
            </div>

            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${response.className}`}
            >
              {response.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
