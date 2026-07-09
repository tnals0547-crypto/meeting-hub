import { Mail, Calendar, Users, UserPlus, Clock, Inbox } from 'lucide-react'
import Button from '@/components/common/Button'

interface EmptyStateProps {
  icon: 'mail' | 'calendar' | 'users' | 'user-plus' | 'clock' | 'inbox'
  title: string
  description?: string
  action?: { label: string; href?: string; onClick?: () => void }
}

const icons = {
  mail: Mail,
  calendar: Calendar,
  users: Users,
  'user-plus': UserPlus,
  clock: Clock,
  inbox: Inbox,
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <Icon className="h-7 w-7 text-gray-400" />
      </div>
      <h3 className="text-title font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1.5 text-body-sm text-gray-500 leading-relaxed max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          <Button
            href={action.href}
            onClick={action.onClick}
            variant="primary"
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}