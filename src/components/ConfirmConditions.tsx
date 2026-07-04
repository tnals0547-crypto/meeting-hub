import type { Meeting } from '@/types/meeting'

interface ConfirmConditionsProps {
  meeting: Meeting
}

interface Condition {
  label: string
  done: boolean
  detail?: string
}

function getConditions(meeting: Meeting): Condition[] {
  const allResponded = meeting.participants.every(
    (p) => p.responseStatus !== 'pending',
  )
  const requiredApproved = meeting.participants
    .filter((p) => p.isRequired)
    .every((p) => p.responseStatus === 'approved')
  const declinedRequired = meeting.participants.find(
    (p) => p.isRequired && p.responseStatus === 'declined',
  )

  const hasSentRequest = meeting.participants.some(
    (p) => p.responseStatus !== 'pending',
  )

  return [
    {
      label: '참석자에게 응답 요청 보내기',
      done: hasSentRequest,
    },
    {
      label: '모든 참석자 응답 완료',
      done: allResponded,
      detail: allResponded
        ? undefined
        : `${meeting.participants.filter((p) => p.responseStatus !== 'pending').length}/${meeting.participants.length}`,
    },
    {
      label: '필수 참석 조건 충족',
      done: requiredApproved,
      detail:
        declinedRequired
          ? `${declinedRequired.name} 대체 필요`
          : undefined,
    },
    {
      label: '회의 확정',
      done: meeting.status === 'confirmed',
    },
  ]
}

export default function ConfirmConditions({ meeting }: ConfirmConditionsProps) {
  const conditions = getConditions(meeting)
  const doneCount = conditions.filter((c) => c.done).length
  const total = conditions.length
  const percent = Math.round((doneCount / total) * 100)
  const remaining = total - doneCount

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
      <div className="flex items-end justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          회의를 확정하려면
        </h3>
        <span className="text-2xl font-bold text-gray-900">{percent}%</span>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gray-800 to-black transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-gray-400">
        {remaining > 0
          ? `남은 작업 ${remaining}개`
          : '모든 조건을 충족했습니다'}
      </p>

      <ul className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
        {conditions.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 text-xs font-bold ${
                c.done
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {c.done ? '✓' : ''}
            </span>
            <span
              className={c.done ? 'text-gray-500' : 'text-gray-900 font-medium'}
            >
              {c.label}
            </span>
            {c.detail && (
              <span className="text-xs text-gray-400">({c.detail})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
