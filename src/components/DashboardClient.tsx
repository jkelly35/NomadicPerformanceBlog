'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  Workout,
  HealthMetric,
  Goal,
  UserStat,
  Meal,
  NutritionGoal,
  logWorkout,
  logMeal,
  updateHealthMetrics,
  getFoodItems,
  FoodItem,
  getMealTemplates,
  MealTemplate,
  getSavedFoods,
  SavedFood,
  logMealFromTemplate,
  getMealTemplateWithItems
} from '@/lib/fitness-data'

interface DashboardData {
  workouts: Workout[]
  healthMetrics: HealthMetric[]
  goals: Goal[]
  userStats: UserStat[]
  weeklyStats: { count: number; totalMinutes: number }
  meals: Meal[]
  nutritionGoals: NutritionGoal[]
  dailyNutritionStats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }
}

function DashboardContent({ 
  data, 
  showWorkoutModal, 
  setShowWorkoutModal, 
  showMealModal, 
  setShowMealModal, 
  showHealthModal, 
  setShowHealthModal,
  onWorkoutSubmit,
  onMealSubmit,
  onHealthSubmit,
  isSubmitting
}: { 
  data: DashboardData
  showWorkoutModal: boolean
  setShowWorkoutModal: (show: boolean) => void
  showMealModal: boolean
  setShowMealModal: (show: boolean) => void
  showHealthModal: boolean
  setShowHealthModal: (show: boolean) => void
  onWorkoutSubmit: (formData: FormData) => Promise<void>
  onMealSubmit: (formData: FormData) => Promise<void>
  onHealthSubmit: (formData: FormData) => Promise<void>
  isSubmitting: boolean
}) {
  const { user } = useAuth()
  const [activityFilter, setActivityFilter] = useState<string>('All')

  // Food selector state
  const [foodSelectorOpen, setFoodSelectorOpen] = useState(false)
  const [foodSelectorSearch, setFoodSelectorSearch] = useState('')
  const [foodSelectorFilter, setFoodSelectorFilter] = useState<'database' | 'templates' | 'saved'>('database')
  const [selectedFoods, setSelectedFoods] = useState<Array<{food: FoodItem, quantity: number}>>([])
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([])
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>([])
  const [isLoadingFoods, setIsLoadingFoods] = useState(false)

  // Helper functions to get data
  const getStatValue = (statType: string) => {
    const stat = data.userStats.find(s => s.stat_type === statType)
    return stat?.value || 0
  }

  const getHealthMetric = (metricType: string) => {
    const metric = data.healthMetrics.find(m => m.metric_type === metricType)
    return metric?.value || 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      const diffTime = Math.abs(today.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `${diffDays} days ago`
    }
  }

  // Food selector functions
  const loadFoodData = async () => {
    setIsLoadingFoods(true)
    try {
      const [foodItemsResult, templatesResult, savedFoodsResult] = await Promise.all([
        getFoodItems(),
        getMealTemplates(),
        getSavedFoods(user!.id)
      ])

      setFoodItems(foodItemsResult)
      setMealTemplates(templatesResult)
      if (savedFoodsResult.success) {
        setSavedFoods(savedFoodsResult.data || [])
      }
    } catch (error) {
      console.error('Error loading food data:', error)
    } finally {
      setIsLoadingFoods(false)
    }
  }

  const addFoodToMeal = (food: FoodItem) => {
    setSelectedFoods(prev => [...prev, { food, quantity: 1 }])
  }

  const addMealTemplateToMeal = async (template: MealTemplate) => {
    try {
      const result = await getMealTemplateWithItems(template.id)
      if (result.template && result.items) {
        const newFoods = result.items.map(item => ({
          food: item.food_item!,
          quantity: item.quantity
        }))
        setSelectedFoods(prev => [...prev, ...newFoods])
      }
    } catch (error) {
      console.error('Error adding meal template to meal:', error)
    }
  }

  const addSavedFoodToMeal = (savedFood: SavedFood) => {
    if (savedFood.food_item) {
      setSelectedFoods(prev => [...prev, { food: savedFood.food_item!, quantity: 1 }])
    }
  }

  const handleQuickLogMeal = async () => {
    if (selectedFoods.length === 0) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const mealData = new FormData()
      mealData.append('meal_type', 'snack')
      mealData.append('meal_date', today)

      // Add meal items
      selectedFoods.forEach(({ food, quantity }, index) => {
        mealData.append(`food_${index}`, food.id)
        mealData.append(`quantity_${index}`, quantity.toString())
      })

      const result = await logMeal(mealData)
      if (result.success) {
        alert('Meal logged successfully!')
        setSelectedFoods([])
        setFoodSelectorOpen(false)
        setFoodSelectorSearch('')
        // Refresh the page to update stats
        window.location.reload()
      } else {
        alert('Failed to log meal: ' + result.error)
      }
    } catch (error) {
      console.error('Error logging meal:', error)
      alert('Failed to log meal: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Load food data when food selector opens
  useEffect(() => {
    if (foodSelectorOpen && foodItems.length === 0) {
      loadFoodData()
    }
  }, [foodSelectorOpen, foodItems.length])

  return (
    <main className="min-h-screen bg-stone-50">
      <NavBar />

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-emerald-800 via-green-700 to-teal-600 text-white text-center min-h-[50vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-wide">
            Welcome Back, {user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Adventurer'}!
          </h1>
          <p className="text-xl md:text-2xl opacity-90 leading-relaxed mb-8">
            Your nomadic fitness journey awaits. Track your trails, fuel your body, and conquer new peaks.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-semibold">
              🔥 Streak: {Math.round(getStatValue('streak_days'))} days
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-semibold">
              🏔️ Next Summit: Utah Trails
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">

          {/* Today's Overview */}
          <div className="bg-gradient-to-br from-white to-stone-50 rounded-2xl p-8 mb-8 border border-stone-200 shadow-lg">
            <h2 className="text-2xl font-bold text-stone-800 mb-6 text-center">
              📊 Today's Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Readiness Score */}
              <div className="bg-white rounded-xl p-6 text-center border border-stone-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
                  {(() => {
                    // Calculate readiness score based on recent activity (last 3 days)
                    const today = new Date();
                    const threeDaysAgo = new Date(today);
                    threeDaysAgo.setDate(today.getDate() - 3);
                    
                    const recentWorkouts = data.workouts.filter(w => {
                      const workoutDate = new Date(w.workout_date);
                      return workoutDate >= threeDaysAgo;
                    });
                    
                    // Base score from recent activity (0-50 points)
                    const activityScore = Math.min(recentWorkouts.length * 10, 50);
                    
                    // Add recovery bonus if available (0-30 points)
                    const recoveryScore = getStatValue('recovery_score') || 0;
                    const recoveryBonus = Math.min(recoveryScore * 0.3, 30);
                    
                    // Add fitness level bonus (0-20 points)
                    const fitnessScore = getStatValue('fitness_score') || 0;
                    const fitnessBonus = Math.min(fitnessScore * 0.2, 20);
                    
                    return Math.round(activityScore + recoveryBonus + fitnessBonus);
                  })()}
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">
                  Readiness Score
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-semibold">
                  <span>⚡</span>
                  <span>Training ready</span>
                </div>
              </div>

              {/* Today's Active Minutes */}
              <div className="bg-white rounded-xl p-6 text-center border border-stone-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white">
                  {data.workouts.filter(w => {
                    const workoutDate = new Date(w.workout_date);
                    const today = new Date();
                    return workoutDate.toDateString() === today.toDateString();
                  }).reduce((total, w) => total + w.duration_minutes, 0)}
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">
                  Today's Minutes
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-sky-600 font-semibold">
                  <span>⏱️</span>
                  <span>Time active</span>
                </div>
              </div>

              {/* Today's Calories */}
              <div className="bg-white rounded-xl p-6 text-center border border-stone-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white">
                  {data.workouts.filter(w => {
                    const workoutDate = new Date(w.workout_date);
                    const today = new Date();
                    return workoutDate.toDateString() === today.toDateString();
                  }).reduce((total, w) => total + (w.calories_burned || 0), 0)}
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">
                  Today's Calories
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600 font-semibold">
                  <span>🔥</span>
                  <span>Energy burned</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/nutrition" className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-8 text-white no-underline block transition-transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="text-center">
                <div className="text-6xl mb-4">🥗</div>
                <h3 className="text-2xl font-bold mb-2">Fueling Log</h3>
                <p className="opacity-90">Log meals, track macros, and fuel your adventures</p>
              </div>
            </Link>
            <Link href="/training" className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-8 text-white no-underline block transition-transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="text-center">
                <div className="text-6xl mb-4">🏔️</div>
                <h3 className="text-2xl font-bold mb-2">Training Log</h3>
                <p className="opacity-90">Track workouts, monitor progress, and conquer new peaks</p>
              </div>
            </Link>
          </div>


          {/* Nutrition Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-stone-800 mb-6 text-center">
              🍎 Daily Fuel Intake
            </h2>

            {/* Compact Nutrition Overview */}
            <div className="bg-gradient-to-br from-stone-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-stone-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Calories */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-stone-700">
                      Calories
                    </span>
                    <span className="text-sm text-stone-600">
                      {data.dailyNutritionStats.total_calories} / {data.nutritionGoals.find(g => g.goal_type === 'daily_calories')?.target_value || 2200}
                    </span>
                  </div>
                  <div className="bg-stone-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full" style={{ width: `${Math.min((data.dailyNutritionStats.total_calories / (data.nutritionGoals.find(g => g.goal_type === 'daily_calories')?.target_value || 2200)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 text-right">
                    {Math.round((data.dailyNutritionStats.total_calories / (data.nutritionGoals.find(g => g.goal_type === 'daily_calories')?.target_value || 2200)) * 100)}% of goal
                  </div>
                </div>

                {/* Protein */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-stone-700">
                      Protein
                    </span>
                    <span className="text-sm text-stone-600">
                      {Math.round(data.dailyNutritionStats.total_protein)}g / {data.nutritionGoals.find(g => g.goal_type === 'protein_target')?.target_value || 150}g
                    </span>
                  </div>
                  <div className="bg-stone-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full" style={{ width: `${Math.min((data.dailyNutritionStats.total_protein / (data.nutritionGoals.find(g => g.goal_type === 'protein_target')?.target_value || 150)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 text-right">
                    {Math.round((data.dailyNutritionStats.total_protein / (data.nutritionGoals.find(g => g.goal_type === 'protein_target')?.target_value || 150)) * 100)}% of goal
                  </div>
                </div>

                {/* Carbs */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-stone-700">
                      Carbs
                    </span>
                    <span className="text-sm text-stone-600">
                      {Math.round(data.dailyNutritionStats.total_carbs)}g / {data.nutritionGoals.find(g => g.goal_type === 'carb_target')?.target_value || 250}g
                    </span>
                  </div>
                  <div className="bg-stone-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full" style={{ width: `${Math.min((data.dailyNutritionStats.total_carbs / (data.nutritionGoals.find(g => g.goal_type === 'carb_target')?.target_value || 250)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 text-right">
                    {Math.round((data.dailyNutritionStats.total_carbs / (data.nutritionGoals.find(g => g.goal_type === 'carb_target')?.target_value || 250)) * 100)}% of goal
                  </div>
                </div>

                {/* Fat */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-stone-700">
                      Fat
                    </span>
                    <span className="text-sm text-stone-600">
                      {Math.round(data.dailyNutritionStats.total_fat)}g / {data.nutritionGoals.find(g => g.goal_type === 'fat_target')?.target_value || 70}g
                    </span>
                  </div>
                  <div className="bg-stone-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-400 to-teal-500 h-full rounded-full" style={{ width: `${Math.min((data.dailyNutritionStats.total_fat / (data.nutritionGoals.find(g => g.goal_type === 'fat_target')?.target_value || 70)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 text-right">
                    {Math.round((data.dailyNutritionStats.total_fat / (data.nutritionGoals.find(g => g.goal_type === 'fat_target')?.target_value || 70)) * 100)}% of goal
                  </div>
                </div>
              </div>

              {/* Meals Summary */}
              <div className="mt-6 pt-6 border-t border-stone-300 flex justify-between items-center">
                <div className="text-sm text-stone-600">
                  Meals logged today: <strong>{data.dailyNutritionStats.meals_count}</strong>
                </div>
                <div className="text-sm text-stone-600">
                  Fiber: <strong>{Math.round(data.dailyNutritionStats.total_fiber)}g</strong>
                </div>
              </div>

              {/* Quick Add Button */}
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setFoodSelectorOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  ⚡ Quick Add Food
                </button>
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Send Logs */}
            <div className="bg-gradient-to-br from-stone-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-stone-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  📝 Send Logs
                </h3>
                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
                >
                  ➕ Log Send
                </button>
              </div>

              {/* Activity Filter */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActivityFilter('All')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      activityFilter === 'All'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                    }`}
                  >
                    All
                  </button>
                  {(user?.user_metadata?.activities || ['Climbing', 'MTB', 'Running', 'Skiing', 'Snowboarding', 'Cycling']).map((activity: string) => (
                    <button
                      key={activity}
                      onClick={() => setActivityFilter(activity)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        activityFilter === activity
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filteredWorkouts = activityFilter === 'All'
                    ? data.workouts
                    : data.workouts.filter(workout => workout.activity_type === activityFilter);
                  
                  return filteredWorkouts.length > 0 ? filteredWorkouts.map((workout) => (
                    <div key={workout.id} className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-stone-800 mb-1">
                            {workout.activity_type}
                          </div>
                          <div className="text-sm text-stone-600">
                            {formatDate(workout.workout_date)} • {workout.duration_minutes} min • {workout.calories_burned || 0} cal
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          workout.intensity === 'High' ? 'bg-red-100 text-red-800' :
                          workout.intensity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {workout.intensity}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-stone-600">
                      No {activityFilter === 'All' ? '' : activityFilter.toLowerCase() + ' '}workouts logged yet. Start your fitness journey!
                    </div>
                  );
                })()}
              </div>

              {/* View All Sends Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => window.location.href = '/sends'}
                  className="bg-gradient-to-br from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
                >
                  📊 View All Sends
                </button>
              </div>
            </div>

            {/* Goals & Targets */}
            <div className="bg-gradient-to-br from-stone-50 to-emerald-50 rounded-xl p-6 shadow-lg border border-stone-200">
              <h3 className="text-2xl font-bold text-stone-800 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  🎯 Goals & Targets
                </span>
                <button
                  onClick={() => window.location.href = '/goals'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ⚙️ Manage Goals
                </button>
              </h3>

              <div className="space-y-6">
                {/* Goals */}
                {data.goals.filter(g => !['weekly_workouts', 'monthly_minutes', 'strength_goals'].includes(g.goal_type)).length > 0 ? (
                  <div className="grid gap-4">
                    {data.goals.filter(g => !['weekly_workouts', 'monthly_minutes', 'strength_goals'].includes(g.goal_type)).map((goal) => (
                      <div key={goal.id} className="bg-white rounded-lg p-4 border border-stone-200">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <div className="font-semibold text-stone-800 text-lg">
                              🎯 {goal.goal_type}
                            </div>
                            <div className="text-sm text-stone-600 mt-1">
                              {Math.round(goal.current_value)} of {Math.round(goal.target_value)} {goal.period}
                            </div>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            (goal.current_value / goal.target_value) * 100 >= 100 ? 'bg-green-100 text-green-800' :
                            (goal.current_value / goal.target_value) * 100 >= 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(goal.current_value / goal.target_value) * 100 >= 100 ? '✅ Complete' :
                             (goal.current_value / goal.target_value) * 100 >= 75 ? '🚀 Almost there' :
                             '🎯 In progress'}
                          </div>
                        </div>
                        <div className="bg-stone-200 rounded-full h-3 overflow-hidden mb-2">
                          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full" style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-sm text-stone-600">
                          <span>{Math.round((goal.current_value / goal.target_value) * 100)}% complete</span>
                          <span>{Math.max(0, Math.round(goal.target_value - goal.current_value))} to go</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-8 text-center border border-stone-200">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-lg font-semibold text-stone-800 mb-2">No Goals Yet</h3>
                    <p className="text-stone-600 mb-4">Create your first goal to start tracking your fitness objectives.</p>
                    <button
                      onClick={() => window.location.href = '/goals'}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Create Your First Goal
                    </button>
                  </div>
                )}
              </div>

              {/* Upcoming Challenges */}
              <div className="mt-6 pt-6 border-t border-stone-300">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">
                  Upcoming Challenges
                </h4>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3 border border-stone-200 text-sm">
                    🏔️ <strong>14er Summit</strong> - 2 weeks
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-stone-200 text-sm">
                    🏃 10K Race - 3 weeks
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-stone-200 text-sm">
                    💪 PR Attempt - 1 month
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Workout Logging Modal */}
      {showWorkoutModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Log Your Send</h2>
            <form action={onWorkoutSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Activity Type
                </label>
                <select 
                  name="activity_type" 
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select activity...</option>
                  <option value="Rock Climbing">🧗 Rock Climbing</option>
                  <option value="Trail Running">🏃 Trail Running</option>
                  <option value="Hiking">🥾 Hiking</option>
                  <option value="Skiing">🎿 Skiing</option>
                  <option value="Snowboarding">🏂 Snowboarding</option>
                  <option value="Cycling">🚴 Cycling</option>
                  <option value="Strength Training">💪 Strength Training</option>
                  <option value="Yoga & Mobility">🧘 Yoga & Mobility</option>
                  <option value="Core Workout">🏋️ Core Workout</option>
                  <option value="Swimming">🏊 Swimming</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Duration (minutes)
                </label>
                <input 
                  type="number" 
                  name="duration_minutes" 
                  required 
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Calories Burned (optional)
                </label>
                <input 
                  type="number" 
                  name="calories_burned" 
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Intensity
                </label>
                <select 
                  name="intensity" 
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Notes (optional)
                </label>
                <textarea 
                  name="notes" 
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Logging...' : 'Log Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Logging Modal */}
      {showMealModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Log Meal</h2>
            <form action={onMealSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Meal Type
                </label>
                <select 
                  name="meal_type" 
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Total Calories
                </label>
                <input 
                  type="number" 
                  name="total_calories" 
                  required 
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Protein (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_protein" 
                    required 
                    min="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Carbs (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_carbs" 
                    required 
                    min="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Fat (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_fat" 
                    required 
                    min="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Fiber (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_fiber" 
                    required 
                    min="0"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Notes (optional)
                </label>
                <textarea 
                  name="notes" 
                  rows={2}
                  placeholder="e.g., Greek yogurt with banana and almonds"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Logging...' : 'Log Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health Metrics Modal */}
      {showHealthModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Update Health Metrics</h2>
            <form action={onHealthSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Resting Heart Rate (bpm)
                </label>
                <input 
                  type="number" 
                  name="resting_hr" 
                  min="40" 
                  max="120"
                  placeholder={getHealthMetric('resting_hr').toString() || '60'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Sleep Quality (%)
                </label>
                <input 
                  type="number" 
                  name="sleep_quality" 
                  min="0" 
                  max="100"
                  placeholder={getHealthMetric('sleep_quality').toString() || '85'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Body Fat (%)
                </label>
                <input 
                  type="number" 
                  name="body_fat" 
                  min="3" 
                  max="50" 
                  step="0.1"
                  placeholder={getHealthMetric('body_fat').toString() || '15'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowHealthModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Health'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Food Selector Modal */}
      {foodSelectorOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#1a3a2a'
              }}>
                Quick Add Food
              </h3>
              <button
                onClick={() => {
                  setFoodSelectorOpen(false)
                  setFoodSelectorSearch('')
                }}
                style={{
                  padding: '0.5rem',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '1rem'
            }}>
              <button
                onClick={() => setFoodSelectorFilter('database')}
                style={{
                  padding: '0.5rem 1rem',
                  background: foodSelectorFilter === 'database' ? '#ff6b35' : '#f8f9fa',
                  color: foodSelectorFilter === 'database' ? '#fff' : '#1a3a2a',
                  border: '1px solid #e9ecef',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                🍎 Food Database
              </button>
              <button
                onClick={() => setFoodSelectorFilter('templates')}
                style={{
                  padding: '0.5rem 1rem',
                  background: foodSelectorFilter === 'templates' ? '#ff6b35' : '#f8f9fa',
                  color: foodSelectorFilter === 'templates' ? '#fff' : '#1a3a2a',
                  border: '1px solid #e9ecef',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                📋 Meal Templates
              </button>
              <button
                onClick={() => setFoodSelectorFilter('saved')}
                style={{
                  padding: '0.5rem 1rem',
                  background: foodSelectorFilter === 'saved' ? '#ff6b35' : '#f8f9fa',
                  color: foodSelectorFilter === 'saved' ? '#fff' : '#1a3a2a',
                  border: '1px solid #e9ecef',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                ⭐ Saved Foods
              </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
              <input
                type="text"
                placeholder="Search foods..."
                value={foodSelectorSearch}
                onChange={(e) => setFoodSelectorSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e9ecef',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Food List */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              display: 'grid',
              gap: '0.5rem'
            }}>
              {isLoadingFoods ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Loading foods...
                </div>
              ) : (
                <>
                  {foodSelectorFilter === 'database' && foodItems
                    .filter(food =>
                      food.name.toLowerCase().includes(foodSelectorSearch.toLowerCase()) ||
                      (food.brand && food.brand.toLowerCase().includes(foodSelectorSearch.toLowerCase()))
                    )
                    .map((food) => (
                      <div
                        key={food.id}
                        onClick={() => addFoodToMeal(food)}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: '#f8f9fa',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: '600',
                              color: '#1a3a2a',
                              marginBottom: '0.25rem'
                            }}>
                              {food.name}
                            </div>
                            {food.brand && (
                              <div style={{
                                fontSize: '0.8rem',
                                color: '#666',
                                marginBottom: '0.5rem'
                              }}>
                                {food.brand}
                              </div>
                            )}
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#666'
                            }}>
                              {food.serving_size} {food.serving_unit} • {food.calories_per_serving} cal
                            </div>
                          </div>
                          <div style={{
                            textAlign: 'right',
                            fontSize: '0.9rem',
                            color: '#666'
                          }}>
                            <div>P: {food.protein_grams}g</div>
                            <div>C: {food.carbs_grams}g</div>
                            <div>F: {food.fat_grams}g</div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {foodSelectorFilter === 'templates' && mealTemplates
                    .filter(template =>
                      template.name.toLowerCase().includes(foodSelectorSearch.toLowerCase())
                    )
                    .map((template) => (
                      <div
                        key={template.id}
                        onClick={() => addMealTemplateToMeal(template)}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: '#f8f9fa',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: '600',
                              color: '#1a3a2a',
                              marginBottom: '0.25rem'
                            }}>
                              📋 {template.name}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#666'
                            }}>
                              {template.total_calories} cal total
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  {foodSelectorFilter === 'saved' && savedFoods
                    .filter(savedFood =>
                      savedFood.food_item?.name.toLowerCase().includes(foodSelectorSearch.toLowerCase()) ||
                      (savedFood.food_item?.brand && savedFood.food_item.brand.toLowerCase().includes(foodSelectorSearch.toLowerCase()))
                    )
                    .map((savedFood) => (
                      <div
                        key={savedFood.id}
                        onClick={() => addSavedFoodToMeal(savedFood)}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e9ecef',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: '#f8f9fa',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#1a3a2a',
                            marginBottom: '0.25rem'
                          }}>
                            ⭐ {savedFood.food_item?.name}
                          </div>
                          {savedFood.food_item?.brand && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#666',
                              marginBottom: '0.5rem'
                            }}>
                              {savedFood.food_item.brand}
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#666'
                          }}>
                            {savedFood.food_item?.serving_size} {savedFood.food_item?.serving_unit} • {savedFood.food_item?.calories_per_serving} cal
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              )}

              {((foodSelectorFilter === 'database' && foodItems.length === 0 && !isLoadingFoods) ||
                (foodSelectorFilter === 'templates' && mealTemplates.length === 0 && !isLoadingFoods) ||
                (foodSelectorFilter === 'saved' && savedFoods.length === 0 && !isLoadingFoods)) && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  {foodSelectorFilter === 'database' && 'No foods found. Try a different search term.'}
                  {foodSelectorFilter === 'templates' && 'No meal templates found. Create some templates first.'}
                  {foodSelectorFilter === 'saved' && 'No saved foods found. Save some foods from the database first.'}
                </div>
              )}
            </div>

            {/* Selected Foods Summary */}
            {selectedFoods.length > 0 && (
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f0f8ff',
                borderRadius: '8px',
                border: '1px solid #b3d9ff'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Selected Foods ({selectedFoods.length})
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '1rem'
                }}>
                  Total: {selectedFoods.reduce((sum, { food, quantity }) => sum + (food.calories_per_serving * quantity), 0)} cal
                </div>
                <button
                  onClick={handleQuickLogMeal}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Log This Meal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Modal states
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Form submission handlers
  const handleWorkoutSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await logWorkout(formData)
      if (result.success) {
        setShowWorkoutModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error logging activity: ' + result.error)
      }
    } catch (error) {
      alert('Error logging activity')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMealSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await logMeal(formData)
      if (result.success) {
        setShowMealModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error logging meal: ' + result.error)
      }
    } catch (error) {
      alert('Error logging meal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHealthSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateHealthMetrics(formData)
      if (result.success) {
        setShowHealthModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error updating health metrics')
      }
    } catch (error) {
      alert('Error updating health metrics')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #1a3a2a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
            animationName: 'spin',
            animationDuration: '1s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite'
          }}></div>
          <p style={{ color: '#666' }}>Loading your dashboard...</p>
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `
        }} />
      </main>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardContent 
    data={data}
    showWorkoutModal={showWorkoutModal}
    setShowWorkoutModal={setShowWorkoutModal}
    showMealModal={showMealModal}
    setShowMealModal={setShowMealModal}
    showHealthModal={showHealthModal}
    setShowHealthModal={setShowHealthModal}
    onWorkoutSubmit={handleWorkoutSubmit}
    onMealSubmit={handleMealSubmit}
    onHealthSubmit={handleHealthSubmit}
    isSubmitting={isSubmitting}
  />
}
