import { Check, Circle, Dot, HelpCircle } from 'lucide-react'
import type { MeetingStatus, MeetingRole } from '@/types/meeting'

interface ProgressStepperProps {
  status: MeetingStatus
  myRole?: MeetingRole
  myResponseStatus?: 'pending' | 'approved' | 'declined'
}

const steps = [
  { label: '회의 생성' },
  { label: '참석 응답' },
  { label: '조건 확인' },
  { label: '회의 확정' },
]

const stepIndex: Record<MeetingStatus, number> = {
  pending: 0,
  response_collecting: 1,
  response_complete: 2,
  confirmed: 3,
}

export default function ProgressStepper({ status, myRole, myResponseStatus }: ProgressStepperProps) {
  const current = stepIndex[status]

  if (myRole === 'participant') {
    const responseLabel = myResponseStatus === 'approved' ? '참석'
      : myResponseStatus === 'declined' ? '불참'
      : '응답 대기'
    const responseColor = myResponseStatus === 'approved' ? 'text-green-700 bg-green-50'
      : myResponseStatus === 'declined' ? 'text-red-700 bg-red-50'
      : 'text-gray-600 bg-gray-100'

    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-body-sm text-gray-500">내 응답</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium ${responseColor}`}>
          {myResponseStatus === 'approved' ? <Check className="h-3.5 w-3.5" />
            : myResponseStatus === 'declined' ? <Circle className="h-3.5 w-3.5" />
            : <HelpCircle className="h-3.5 w-3.5" />}
          {responseLabel}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const isCompleted = i < current
        const isActive = i === current
        return (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                isCompleted ? 'bg-green-500 text-white'
                  : isActive ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {isCompleted ? <Check className="h-4 w-4" /> : isActive ? <Dot className="h-6 w-6" /> : i + 1}
              </div>
              <span className={`text-2xs whitespace-nowrap ${
                isActive ? 'font-semibold text-gray-900'
                  : isCompleted ? 'text-gray-600'
                  : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < current ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
