'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { format, isToday } from 'date-fns'
import { PlannedMeal, MealTemplate } from '@/lib/fitness-data'
import { FoodItem } from '@/lib/features/nutrition'

interface MealPlanningCalendarProps {
  weekDays: Date[]
  mealTypes: string[]
  plannedMeals: PlannedMeal[]
  onRemoveMeal: (mealId: string) => void
  onAddMeal: (date: string, mealType: string, meal: PlannedMeal) => void
  availableFoods: FoodItem[]
  mealTemplates: MealTemplate[]
  isLoading: boolean
}

interface MealSlotProps {
  date: Date
  mealType: string
  plannedMeals: PlannedMeal[]
  onRemoveMeal: (mealId: string) => void
  onAddMeal: (date: string, mealType: string, meal: PlannedMeal) => void
  availableFoods: FoodItem[]
  mealTemplates: MealTemplate[]
}

interface MealSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMeal: (meal: PlannedMeal) => void
  availableFoods: FoodItem[]
  mealTemplates: MealTemplate[]
  date: Date
  mealType: string
}

function MealSelectionModal({ isOpen, onClose, onSelectMeal, availableFoods, mealTemplates, date, mealType }: MealSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'foods'>('templates')
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const filteredTemplates = mealTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFoods = availableFoods.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectTemplate = (template: MealTemplate) => {
    const plannedMeal: PlannedMeal = {
      id: `temp-${Date.now()}`,
      user_id: '',
      meal_type: mealType as any,
      planned_date: format(date, 'yyyy-MM-dd'),
      meal_template_id: template.id,
      custom_name: template.name,
      notes: '',
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onSelectMeal(plannedMeal)
  }

  const handleSelectFood = (food: FoodItem) => {
    const plannedMeal: PlannedMeal = {
      id: `temp-${Date.now()}`,
      user_id: '',
      meal_type: mealType as any,
      planned_date: format(date, 'yyyy-MM-dd'),
      custom_name: food.name,
      notes: `From food database: ${food.brand || 'Generic'}`,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onSelectMeal(plannedMeal)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Meal - {format(date, 'MMM d, yyyy')} - {mealType}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search meals or foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Tabs */}
          <div className="flex mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Meal Templates ({filteredTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('foods')}
              className={`px-4 py-2 font-medium text-sm ml-4 ${
                activeTab === 'foods'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Food Database ({filteredFoods.length})
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'templates' ? (
            <div className="space-y-3">
              {filteredTemplates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No meal templates found</p>
              ) : (
                filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{template.total_calories} cal</span>
                          <span>{template.total_protein}g protein</span>
                          <span>{template.total_carbs}g carbs</span>
                          <span>{template.total_fat}g fat</span>
                        </div>
                      </div>
                      <div className="text-orange-600">→</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFoods.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No foods found</p>
              ) : (
                filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{food.name}</h4>
                        <p className="text-sm text-gray-600">{food.brand || 'Generic'}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>{food.serving_size}{food.serving_unit}</span>
                          <span>{food.calories_per_serving || 0} cal</span>
                        </div>
                      </div>
                      <div className="text-orange-600">→</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MealSlot({ date, mealType, plannedMeals, onRemoveMeal, onAddMeal, availableFoods, mealTemplates }: MealSlotProps) {
  const [showModal, setShowModal] = useState(false)
  const dateStr = format(date, 'yyyy-MM-dd')
  const slotId = `slot-${dateStr}-${mealType}`

  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
  })

  const mealsForSlot = plannedMeals.filter(
    meal => meal.planned_date === dateStr && meal.meal_type === mealType
  )

  const handleSlotClick = (e: React.MouseEvent) => {
    // Only show modal if not clicking on an existing meal
    if ((e.target as HTMLElement).closest('[draggable]')) return
    setShowModal(true)
  }

  return (
    <>
      <div
        ref={setNodeRef}
        onClick={handleSlotClick}
        className={`min-h-[80px] p-2 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
          isOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
            Click to add meal
          </div>
        )}
      </div>

      <MealSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectMeal={(meal) => {
          onAddMeal(dateStr, mealType, meal)
          setShowModal(false)
        }}
        availableFoods={availableFoods}
        mealTemplates={mealTemplates}
        date={date}
        mealType={mealType}
      />
    </>
  )
}

export default function MealPlanningCalendar({
  weekDays,
  mealTypes,
  plannedMeals,
  onRemoveMeal,
  onAddMeal,
  availableFoods,
  mealTemplates,
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
                onAddMeal={onAddMeal}
                availableFoods={availableFoods}
                mealTemplates={mealTemplates}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
