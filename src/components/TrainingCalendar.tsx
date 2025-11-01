'use client'

import { useState, useEffect } from 'react'
import { UserTrainingPlan, getUserTrainingPlans } from '@/lib/fitness-data'

interface TrainingCalendarProps {
  onDayClick?: (date: string, dayData?: any) => void
  compact?: boolean
}

export default function TrainingCalendar({ onDayClick, compact = false }: TrainingCalendarProps) {
  const [userPlans, setUserPlans] = useState<UserTrainingPlan[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserPlans()
  }, [])

  const loadUserPlans = async () => {
    setLoading(true)
    try {
      const plans = await getUserTrainingPlans()
      setUserPlans(plans)
    } catch (error) {
      console.error('Error loading training plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const activePlan = userPlans.find(plan => plan.is_active)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getTrainingForDate = (date: Date) => {
    if (!activePlan) return null

    const planStartDate = new Date(activePlan.start_date)
    const daysSinceStart = Math.floor((date.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceStart < 0) return null // Before plan start

    // Calculate which week and day of the plan this date falls on
    const currentWeekIndex = Math.floor(daysSinceStart / 7)
    const currentDayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, etc.

    // Find the appropriate phase
    let totalWeeks = 0
    let targetPhase = null
    let targetWeek = null
    let targetDay = null

    for (const phase of activePlan.plan.phases || []) {
      if (currentWeekIndex < totalWeeks + phase.duration_weeks) {
        targetPhase = phase
        const weekInPhase = currentWeekIndex - totalWeeks
        targetWeek = phase.weeks?.[weekInPhase]
        targetDay = targetWeek?.days?.find(d => d.day_number === currentDayOfWeek + 1) // Convert to 1-based
        break
      }
      totalWeeks += phase.duration_weeks
    }

    return {
      phase: targetPhase,
      week: targetWeek,
      day: targetDay,
      isRestDay: !targetDay,
      dayNumber: daysSinceStart + 1
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date()

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!activePlan) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Active Training Plan</h3>
          <p className="text-gray-600 mb-4">Assign a training plan to view your schedule</p>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Browse Training Plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <p className="text-sm text-gray-600">{activePlan.plan.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            ‹
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            ›
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="p-2"></div>
          }

          const trainingData = getTrainingForDate(date)
          const isToday = date.toDateString() === today.toDateString()
          const isPast = date < today && date.toDateString() !== today.toDateString()

          return (
            <div
              key={date.toISOString()}
              onClick={() => onDayClick?.(date.toISOString().split('T')[0], trainingData)}
              className={`
                min-h-20 p-2 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-md
                ${isToday ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:bg-gray-50'}
                ${isPast ? 'bg-gray-50' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-orange-600' : isPast ? 'text-gray-400' : 'text-gray-900'}`}>
                {date.getDate()}
              </div>

              {trainingData && (
                <div className="space-y-1">
                  {trainingData.day ? (
                    <div className="text-xs">
                      <div className="font-medium text-blue-600 truncate">
                        {trainingData.day.name}
                      </div>
                      <div className="text-gray-500">
                        {trainingData.day.exercises?.length || 0} exercises
                      </div>
                      {trainingData.phase && (
                        <div className="text-xs text-purple-600 mt-1">
                          Phase {trainingData.phase.phase_number}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">
                      Rest Day
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {!compact && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-200 border border-orange-500 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
              <span>Training Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>Rest Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Past Days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
