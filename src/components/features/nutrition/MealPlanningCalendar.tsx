'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday } from 'date-fns'
import { PlannedMeal } from '@/lib/fitness-data'

interface MealPlanningCalendarProps {
  weekDays: Date[]
  mealTypes: string[]
  plannedMeals: PlannedMeal[]
  onRemoveMeal: (mealId: string) => void
  isLoading: boolean
}

interface MealSlotProps {
  date: Date
  mealType: string
  plannedMeals: PlannedMeal[]
  onRemoveMeal: (mealId: string) => void
}

function MealSlot({ date, mealType, plannedMeals, onRemoveMeal }: MealSlotProps) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const slotId = `slot-${dateStr}-${mealType}`

  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  })

  const mealsForSlot = plannedMeals.filter(
    meal => meal.planned_date === dateStr && meal.meal_type === mealType
  )

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[80px] p-2 border-2 border-dashed rounded-lg transition-colors ${
        isOver
          ? 'border-blue-400 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${isToday(date) ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
    >
      <div className="text-xs font-medium text-gray-500 mb-1 capitalize">
        {mealType}
      </div>

      <SortableContext items={mealsForSlot.map(m => `planned-${m.id}`)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {mealsForSlot.map((meal) => (
            <div
              key={`planned-${meal.id}`}
              draggable
              className="p-2 bg-green-100 border border-green-200 rounded text-sm cursor-move hover:bg-green-200 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 truncate">
                  {meal.custom_name || 'Planned Meal'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveMeal(meal.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-1"
                >
                  ×
                </button>
              </div>
              {meal.is_completed && (
                <div className="text-xs text-green-600 mt-1">✓ Completed</div>
              )}
            </div>
          ))}
        </div>
      </SortableContext>

      {mealsForSlot.length === 0 && (
        <div className="text-xs text-gray-400 italic">
          Drop meal here
        </div>
      )}
    </div>
  )
}

export default function MealPlanningCalendar({
  weekDays,
  mealTypes,
  plannedMeals,
  onRemoveMeal,
  isLoading
}: MealPlanningCalendarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-8 gap-4">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-4 font-semibold text-gray-900">Meal Type</div>
        {weekDays.map((day) => (
          <div
            key={format(day, 'yyyy-MM-dd')}
            className={`p-4 text-center font-semibold ${
              isToday(day) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
            }`}
          >
            <div className="text-sm">{format(day, 'EEE')}</div>
            <div className="text-lg">{format(day, 'd')}</div>
          </div>
        ))}
      </div>

      {/* Meal Type Rows */}
      {mealTypes.map((mealType) => (
        <div key={mealType} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0">
          <div className="p-4 font-medium text-gray-700 capitalize bg-gray-50">
            {mealType}
          </div>
          {weekDays.map((day) => (
            <div key={`${mealType}-${format(day, 'yyyy-MM-dd')}`} className="p-2">
              <MealSlot
                date={day}
                mealType={mealType}
                plannedMeals={plannedMeals}
                onRemoveMeal={onRemoveMeal}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
