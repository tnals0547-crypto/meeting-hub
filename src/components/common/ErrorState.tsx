import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from '@/components/common/Button'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  title = '오류가 발생했습니다',
  description = '잠시 후 다시 시도해주세요.',
  onRetry,
  retryLabel = '다시 시도',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="text-title font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 text-body-sm text-gray-500 leading-relaxed max-w-xs">{description}</p>
      {onRetry && (
        <div className="mt-5">
          <Button onClick={onRetry} variant="secondary" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
