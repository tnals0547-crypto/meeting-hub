import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 bg-gray-50 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-h-[520px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h1 className="text-heading-s font-semibold text-gray-900">채팅</h1>
          <p className="mt-0.5 text-body-sm text-gray-500">회의 관련 대화를 한 곳에서 확인합니다.</p>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-title font-semibold text-gray-900">채팅 기능은 준비 중입니다</h2>
          <p className="mt-2 max-w-sm text-body-sm text-gray-500">
            대화가 열리면 이 영역에 메시지 목록과 스레드가 표시됩니다.
          </p>
        </div>
      </section>

      <aside className="hidden rounded-xl border border-gray-200 bg-white p-5 lg:block">
        <h2 className="text-title font-semibold text-gray-900">대화 정보</h2>
        <div className="mt-4 space-y-3 text-body-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">상태</span>
            <span className="font-medium text-gray-900">준비 중</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">회의 관련</span>
            <span className="font-medium text-gray-900">0건</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
