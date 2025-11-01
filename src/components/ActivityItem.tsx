'use client'

import Link from 'next/link'
import { Send } from '@/lib/fitness-data'

interface ActivityItemProps {
  send: Send
  formatDate: (dateString: string) => string
}

export default function ActivityItem({ send, formatDate }: ActivityItemProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-stone-800 mb-1">
            {send.sport.charAt(0).toUpperCase() + send.sport.slice(1)}
          </div>
          <div className="text-sm text-stone-600">
            {formatDate(send.activity_date)} • {send.duration_minutes || 0} min
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/activities"
            className="text-stone-500 hover:text-stone-700 p-1 rounded transition-colors"
            title="Edit activity"
          >
            ✏️
          </Link>
          <div className={`px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800`}>
            Activity
          </div>
        </div>
      </div>
    </div>
  )
}
