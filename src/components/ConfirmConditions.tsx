import type { Meeting } from '@/types/meeting'
import { Check, Circle, AlertTriangle, CheckCircle } from 'lucide-react'

interface ConfirmConditionsProps {
  meeting: Meeting
}

interface Condition {
  title: string
  done: boolean
  icon: React.ReactNode
  detail?: string
  status: 'done' | 'current' | 'pending'
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

  const respondedCount = meeting.participants.filter(
    (p) => p.responseStatus !== 'pending',
  ).length
  const totalCount = meeting.participants.length

  return [
    {
      title: '참석자 응답 요청',
      done: hasSentRequest,
      icon: hasSentRequest ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />,
      detail: hasSentRequest ? `${respondedCount}/${totalCount}명 응답` : undefined,
      status: hasSentRequest ? (allResponded ? 'done' : 'current') : 'current',
    },
    {
      title: '모든 참석자 응답 완료',
      done: allResponded,
      icon: allResponded ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />,
      status: allResponded ? 'done' : (hasSentRequest ? 'current' : 'pending'),
      detail: allResponded
        ? undefined
        : `${respondedCount}/${totalCount}`,
    },
    {
      title: '필수 참석 조건 충족',
      done: requiredApproved,
      icon: requiredApproved
        ? <Check className="h-4 w-4" />
        : declinedRequired
          ? <AlertTriangle className="h-4 w-4" />
          : <Circle className="h-4 w-4" />,
      detail: declinedRequired
        ? `${declinedRequired.name} 대체 참석 요청 필요`
        : undefined,
      status: requiredApproved ? 'done' : (declinedRequired ? 'current' : 'pending'),
    },
    {
      title: '회의 확정',
      done: meeting.status === 'confirmed',
      icon: meeting.status === 'confirmed' ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />,
      status: meeting.status === 'confirmed' ? 'done' : 'pending',
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
    <div className="rounded-xl border border-gray-100 bg-white p-5">
      <div className="flex items-end justify-between">
        <h3 className="text-title font-semibold text-gray-900">회의 확정 조건</h3>
        <span className="text-heading-s font-bold text-gray-900">{doneCount}/{total}</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-info transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="mt-1.5 text-body-sm text-gray-500">
        {remaining > 0
          ? `남은 작업 ${remaining}개`
          : '모든 조건을 충족했습니다'}
      </p>

      <ul className="mt-4 flex flex-col gap-2.5 border-t border-gray-100 pt-4">
        {conditions.map((c) => (
          <li key={c.title} className="flex items-center gap-2.5 text-title">
            <span
              className={`flex items-center justify-center w-5 h-5 rounded-full shrink-0 ${
                c.status === 'done'
                  ? 'bg-info text-white'
                  : c.status === 'current'
                    ? 'bg-info text-white ring-4 ring-info-bg'
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              {c.icon}
            </span>
            <span
              className={
                c.status === 'done'
                  ? 'text-gray-500 line-through'
                  : c.status === 'current'
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-400'
              }
            >
              {c.title}
            </span>
            {c.detail && (
              <span className="text-body-sm text-gray-500">
                ({c.detail})
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
