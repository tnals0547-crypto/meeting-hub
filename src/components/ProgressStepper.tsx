import type { MeetingStatus } from '@/types/meeting'

interface ProgressStepperProps {
  status: MeetingStatus
}

const steps = [
  { label: '회의 생성' },
  { label: '참석 응답' },
  { label: '참석 조건 확인' },
  { label: '회의 확정' },
]

const stepIndex: Record<MeetingStatus, number> = {
  pending: 0,
  response_collecting: 1,
  response_complete: 2,
  confirmed: 3,
}

export default function ProgressStepper({ status }: ProgressStepperProps) {
  const current = stepIndex[status]

  return (
    <div className="flex flex-col gap-4">
      {steps.map((step, i) => {
        const isCompleted = i < current
        const isActive = i === current

        return (
          <div key={step.label} className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-base font-semibold shrink-0 ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-black text-white ring-4 ring-black/10'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {isCompleted ? '✓' : i + 1}
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm ${
                  isActive
                    ? 'font-semibold text-gray-900'
                    : isCompleted
                      ? 'text-gray-600'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {isActive && (
                <span className="text-xs text-gray-400">현재 단계</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
