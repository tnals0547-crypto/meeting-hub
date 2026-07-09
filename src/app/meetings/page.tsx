import { meetings } from '@/data/mock'
import HomeContent from '@/components/HomeContent'

export default function MeetingsPage() {
  return (
    <div className="flex flex-col items-center bg-zinc-50 min-h-full">
      <HomeContent meetings={meetings} />
    </div>
  )
}
