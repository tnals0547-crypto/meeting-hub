import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gray-50 px-6">
      <div className="text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-heading-s font-semibold text-gray-900">채팅</h1>
        <p className="mt-2 text-body-sm text-gray-600">
          채팅 기능은 준비 중입니다.
        </p>
      </div>
    </div>
  )
}
