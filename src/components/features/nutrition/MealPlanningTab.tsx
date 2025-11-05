'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import MealPlanningCalendar from './MealPlanningCalendar'
import SmartRecipeSuggestions from './SmartRecipeSuggestions'
import { MealTemplate, PlannedMeal, SavedFood } from '@/lib/fitness-data'
import { FoodItem } from '@/lib/features/nutrition'

interface MealPlanningTabProps {
  mealTemplates: MealTemplate[]
  foodItems: FoodItem[]
  savedFoods: SavedFood[]
  userGoals?: any[] // TODO: Add proper NutritionGoal type
  onMealPlanned?: (meal: PlannedMeal) => void
}

export default function MealPlanningTab({ mealTemplates, foodItems, savedFoods, userGoals = [], onMealPlanned }: MealPlanningTabProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const monday = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday start
    return addDays(monday, i)
  })

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']

  useEffect(() => {
    loadPlannedMeals()
  }, [currentWeek])

  const loadPlannedMeals = async () => {
    setIsLoading(true)
    try {
      // TODO: Load planned meals from database
      // For now, using mock data
      setPlannedMeals([])
    } catch (error) {
      console.error('Error loading planned meals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Parse the drag operation
    const [activeType, activeDate, activeMealType] = activeId.split('-')
    const [overType, overDate, overMealType] = overId.split('-')

    if (activeType === 'template' && overType === 'slot') {
      // Dragging a meal template to a time slot
      const templateId = activeId.replace('template-', '')
      const template = mealTemplates.find(t => t.id === templateId)

      if (template) {
        planMeal(template, overDate, overMealType)
      }
    } else if (activeType === 'planned' && overType === 'slot') {
      // Moving a planned meal to a different slot
      const plannedMealId = activeId.replace('planned-', '')
      const plannedMeal = plannedMeals.find(m => m.id === plannedMealId)

      if (plannedMeal && (plannedMeal.planned_date !== overDate || plannedMeal.meal_type !== overMealType)) {
        movePlannedMeal(plannedMeal, overDate, overMealType)
      }
    }

    setActiveId(null)
  }

  const planMeal = async (template: MealTemplate, dateStr: string, mealType: string) => {
    try {
      const plannedMeal: PlannedMeal = {
        id: `temp-${Date.now()}`,
        user_id: '', // Will be set by API
        meal_type: mealType as any,
        planned_date: dateStr,
        meal_template_id: template.id,
        custom_name: template.name,
        notes: '',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setPlannedMeals(prev => [...prev, plannedMeal])

      // TODO: Save to database
      if (onMealPlanned) {
        onMealPlanned(plannedMeal)
      }
    } catch (error) {
      console.error('Error planning meal:', error)
    }
  }

  const movePlannedMeal = async (meal: PlannedMeal, newDate: string, newMealType: string) => {
    try {
      const updatedMeal = { ...meal, planned_date: newDate, meal_type: newMealType as any }
      setPlannedMeals(prev => prev.map(m => m.id === meal.id ? updatedMeal : m))

      // TODO: Update in database
    } catch (error) {
      console.error('Error moving planned meal:', error)
    }
  }

  const addMealToCalendar = (dateStr: string, mealType: string, meal: PlannedMeal) => {
    setPlannedMeals(prev => [...prev, meal])
    if (onMealPlanned) {
      onMealPlanned(meal)
    }
  }

  const removePlannedMeal = async (mealId: string) => {
    try {
      setPlannedMeals(prev => prev.filter(m => m.id !== mealId))
      // TODO: Remove from database
    } catch (error) {
      console.error('Error removing planned meal:', error)
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7
    setCurrentWeek(prev => addDays(prev, days))
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Meal Planning Calendar</h2>
          <p className="text-gray-600">Plan your meals for the week with drag-and-drop</p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            ←
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Today
          </button>

          <span className="text-lg font-semibold text-gray-900">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </span>

          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-8 gap-4">
          {/* Meal Templates Sidebar */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Meal Templates</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <SortableContext items={mealTemplates.map(t => `template-${t.id}`)} strategy={verticalListSortingStrategy}>
                  {mealTemplates.map((template) => (
                    <div
                      key={`template-${template.id}`}
                      draggable
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.meal_type}</div>
                      <div className="text-xs text-gray-500">
                        {template.total_calories} cal
                      </div>
                    </div>
                  ))}
                </SortableContext>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="col-span-6">
            <MealPlanningCalendar
              weekDays={weekDays}
              mealTypes={mealTypes}
              plannedMeals={plannedMeals}
              onRemoveMeal={removePlannedMeal}
              onAddMeal={addMealToCalendar}
              availableFoods={foodItems}
              mealTemplates={mealTemplates}
              isLoading={isLoading}
            />
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg shadow-lg">
              {activeId.startsWith('template-') && (
                <div className="font-medium text-gray-900">
                  {mealTemplates.find(t => `template-${t.id}` === activeId)?.name}
                </div>
              )}
              {activeId.startsWith('planned-') && (
                <div className="font-medium text-gray-900">
                  {plannedMeals.find(m => `planned-${m.id}` === activeId)?.custom_name}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Smart Recipe Suggestions */}
      <SmartRecipeSuggestions
        userGoals={userGoals}
        onRecipeSelect={(recipe) => {
          // TODO: Handle recipe selection for meal planning
          console.log('Recipe selected:', recipe)
        }}
      />
    </div>
  )
}
