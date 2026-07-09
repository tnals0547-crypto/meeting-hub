'use client'

import { useState, useMemo } from 'react'
import type { TeamMember } from '@/types/meeting'
import { X, Plus } from 'lucide-react'

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
        <span className="text-title font-semibold text-gray-900">참석자</span>
        <span className="text-caption text-gray-600">{total}/6명</span>
      </div>

      <button
        onClick={() => setShowList(!showList)}
        className="mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-[8px] border border-dashed border-gray-200 px-4 text-body-sm text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-700"
      >
        {showList ? '접기' : <><Plus className="h-4 w-4" /> 팀원 추가</>}
      </button>

      {showList && (
        <div className="mt-3 rounded-[8px] border border-gray-100 bg-gray-50">
          {availableMembers.length === 0 ? (
            <p className="p-4 text-center text-title text-gray-600">
              추가할 수 있는 팀원이 없습니다
            </p>
          ) : (
            availableMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0"
              >
                <div>
                  <p className="text-title font-medium text-gray-900">{member.name}</p>
                  <p className="text-body-sm text-gray-600">
                    {member.department} · {member.role}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAddRequired(member)}
                    className="inline-flex h-7 items-center rounded-[8px] bg-gray-900 px-2.5 text-caption font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    필수로 추가
                  </button>
                  <button
                    onClick={() => onAddOptional(member)}
                    className="inline-flex h-7 items-center rounded-[8px] bg-gray-100 px-2.5 text-caption font-medium text-gray-600 transition-colors hover:bg-gray-200"
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
          <p className="text-title font-medium text-gray-700">필수 참석자</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {requiredMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-gray-100 px-2 text-caption font-medium text-gray-700"
              >
                {member.name}
                <button
                  onClick={() => onRemove(member)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {optionalMembers.length > 0 && (
        <div className="mt-3">
          <p className="text-title font-medium text-gray-600">선택 참석자</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {optionalMembers.map((member) => (
              <span
                key={member.id}
                className="inline-flex h-6 items-center gap-1 rounded-full bg-gray-100 px-2 text-caption font-medium text-gray-700"
              >
                {member.name}
                <button
                  onClick={() => onRemove(member)}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
