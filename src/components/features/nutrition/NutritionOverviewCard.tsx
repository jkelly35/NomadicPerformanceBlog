'use client'

import React from 'react'

interface NutritionStats {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  meals_count: number
}

interface NutritionGoal {
  goal_type: string
  target_value: number
}

interface NutritionOverviewCardProps {
  nutritionStats: NutritionStats
  nutritionGoals: NutritionGoal[]
  hydrationTotal: number
  caffeineTotal: number
  onQuickAddFood?: () => void
  onQuickAddWater?: () => void
  onLogHydration?: (amount: number) => void
  showQuickActions?: boolean
  className?: string
}

export default function NutritionOverviewCard({
  nutritionStats,
  nutritionGoals,
  hydrationTotal,
  caffeineTotal,
  onQuickAddFood,
  onQuickAddWater,
  onLogHydration,
  showQuickActions = true,
  className = ''
}: NutritionOverviewCardProps) {
  const getGoalValue = (goalType: string, defaultValue: number) => {
    return nutritionGoals.find(g => g.goal_type === goalType)?.target_value || defaultValue
  }

  const MacroItem = ({
    label,
    value,
    unit,
    goal,
    color,
    progressColor
  }: {
    label: string
    value: number
    unit: string
    goal: number
    color: string
    progressColor: string
  }) => {
    const progress = Math.min((value / goal) * 100, 100)

    return (
      <div className="text-center">
        <div className={`text-3xl font-bold mb-2 ${color}`}>
          {Math.round(value)}{unit}
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-3">
          {label}
        </div>
        <div className="bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-xs text-slate-500">
          Goal: {goal}{unit}
        </div>
      </div>
    )
  }

  const HydrationItem = () => {
    const goal = 3000 // ml
    const progress = Math.min((hydrationTotal / goal) * 100, 100)

    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {Math.round(hydrationTotal)}ml
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-3">
          💧 Hydration
        </div>
        <div className="bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-xs text-slate-500">
          Goal: {goal}ml
        </div>
      </div>
    )
  }

  const CaffeineItem = () => {
    const limit = 400 // mg

    return (
      <div className="text-center">
        <div className={`text-3xl font-bold mb-2 ${caffeineTotal > limit ? 'text-red-600' : 'text-orange-600'}`}>
          {Math.round(caffeineTotal)}mg
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-3">
          ☕ Caffeine
        </div>
        <div className="bg-slate-200 rounded-full h-4 overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all duration-500 ${caffeineTotal > limit ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`} style={{ width: `${Math.min((caffeineTotal / limit) * 100, 100)}%` }}></div>
        </div>
        <div className="text-xs text-slate-500">
          Limit: {limit}mg
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 rounded-3xl p-10 shadow-xl border border-slate-200/50 backdrop-blur-sm ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
        <MacroItem
          label="Calories"
          value={nutritionStats.total_calories}
          unit=""
          goal={getGoalValue('daily_calories', 2200)}
          color="text-orange-600"
          progressColor="bg-gradient-to-r from-orange-400 to-red-500"
        />
        <MacroItem
          label="Protein"
          value={nutritionStats.total_protein}
          unit="g"
          goal={getGoalValue('protein_target', 150)}
          color="text-blue-600"
          progressColor="bg-gradient-to-r from-blue-400 to-purple-500"
        />
        <MacroItem
          label="Carbs"
          value={nutritionStats.total_carbs}
          unit="g"
          goal={getGoalValue('carb_target', 250)}
          color="text-pink-600"
          progressColor="bg-gradient-to-r from-pink-400 to-rose-500"
        />
        <MacroItem
          label="Fat"
          value={nutritionStats.total_fat}
          unit="g"
          goal={getGoalValue('fat_target', 70)}
          color="text-cyan-600"
          progressColor="bg-gradient-to-r from-cyan-400 to-teal-500"
        />
        <HydrationItem />
        <CaffeineItem />
      </div>

      {/* Meals Summary & Quick Actions */}
      <div className="mt-8 pt-6 border-t border-slate-300">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="text-sm text-stone-600">
            Meals logged today: <strong className="text-stone-800">{nutritionStats.meals_count}</strong>
          </div>
          <div className="text-sm text-stone-600">
            Fiber: <strong className="text-stone-800">{Math.round(nutritionStats.total_fiber)}g</strong>
          </div>
        </div>

        {showQuickActions && (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {onQuickAddFood && (
              <button
                onClick={onQuickAddFood}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                ⚡ Quick Add Food
              </button>
            )}
            {onQuickAddWater && (
              <button
                onClick={onQuickAddWater}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                💧 Quick Add Water
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
