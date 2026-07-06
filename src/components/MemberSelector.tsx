'use client'

import { useState, useMemo } from 'react'
import type { TeamMember } from '@/types/meeting'

interface MemberSelectorProps {
  allMembers: TeamMember[]
  requiredMembers: TeamMember[]
  optionalMembers: TeamMember[]
  onAddRequired: (member: TeamMember) => void
  onAddOptional: (member: TeamMember) => void
  onRemove: (member: TeamMember) => void
}

export default function MemberSelector({
  allMembers,
  requiredMembers,
  optionalMembers,
  onAddRequired,
  onAddOptional,
  onRemove,
}: MemberSelectorProps) {
  const [showList, setShowList] = useState(false)

  const availableMembers = useMemo(
    () =>
      allMembers.filter(
        (m) =>
          !requiredMembers.find((r) => r.id === m.id) &&
          !optionalMembers.find((o) => o.id === m.id),
      ),
    [allMembers, requiredMembers, optionalMembers],
  )

  const total = requiredMembers.length + optionalMembers.length

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">참석자</span>
        <span className="text-xs text-gray-400">{total}/6명</span>
      </div>

      <button
        onClick={() => setShowList(!showList)}
        className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
      >
        {showList ? '접기' : '+ 팀원 추가'}
      </button>

      {showList && (
        <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50">
          {availableMembers.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">
              추가할 수 있는 팀원이 없습니다
            </p>
          ) : (
            availableMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">
                    {member.department} · {member.role}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAddRequired(member)}
                    className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                  >
                    필수로 추가
                  </button>
                  <button
                    onClick={() => onAddOptional(member)}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                  >
                    선택으로 추가
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {requiredMembers.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-blue-600">필수 참석자</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {requiredMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-700"
              >
                {member.name}
                <button
                  onClick={() => onRemove(member)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-blue-100"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {optionalMembers.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-gray-500">선택 참석자</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {optionalMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
              >
                {member.name}
                <button
                  onClick={() => onRemove(member)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-gray-200"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
