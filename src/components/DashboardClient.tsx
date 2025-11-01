'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ActivityItem from "@/components/ActivityItem";
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
  getMealTemplateWithItems,
  logHydration,
  getDailyNutritionStats,
  getDailyHydrationTotal,
  Event as FitnessEvent,
  Send,
  Equipment,
  createSend,
  getUserEquipment,
  logSend
} from '@/lib/fitness-data'

interface DashboardData {
  workouts: Workout[]
  sends: Send[]
  healthMetrics: HealthMetric[]
  goals: Goal[]
  events: FitnessEvent[]
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
  dailyHydrationTotal: number
  equipment: Equipment[]
}

function DashboardContent({ 
  data, 
  showWorkoutModal, 
  setShowWorkoutModal, 
  showMealModal, 
  setShowMealModal, 
  showHealthModal, 
  setShowHealthModal,
  showHydrationModal,
  setShowHydrationModal,
  onWorkoutSubmit,
  onMealSubmit,
  onHealthSubmit,
  onHydrationSubmit,
  isSubmitting,
  localHydrationTotal,
  localNutritionStats,
  setLocalNutritionStats,
  user,
  loading,
  selectedSport,
  setSelectedSport,
  sendData,
  setSendData,
  handleSportChange,
  handleEquipmentToggle,
  handleSendSubmit,
  renderSportSpecificFields
}: { 
  data: DashboardData
  showWorkoutModal: boolean
  setShowWorkoutModal: (show: boolean) => void
  showMealModal: boolean
  setShowMealModal: (show: boolean) => void
  showHealthModal: boolean
  setShowHealthModal: (show: boolean) => void
  showHydrationModal: boolean
  setShowHydrationModal: (show: boolean) => void
  onWorkoutSubmit: (formData: FormData) => Promise<void>
  onMealSubmit: (formData: FormData) => Promise<void>
  onHealthSubmit: (formData: FormData) => Promise<void>
  onHydrationSubmit: (formData: FormData) => Promise<void>
  isSubmitting: boolean
  localHydrationTotal: number
  localNutritionStats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }
  setLocalNutritionStats: (stats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }) => void
  user: any
  loading: boolean
  selectedSport: string
  setSelectedSport: (sport: string) => void
  sendData: {
    activity_date: string
    duration_minutes: string
    notes: string
    rating: string
    weather_conditions: string
    partners: string
    climb_type: string
    climb_name: string
    climb_grade: string
    climb_location: string
    trail_name: string
    trail_level: string
    trail_time: string
    trail_distance: string
    mountain_name: string
    vertical_feet: string
    runs_completed: string
    run_distance: string
    run_time: string
    run_pace: string
    run_elevation_gain: string
    equipment_used: string[]
  }
  setSendData: React.Dispatch<React.SetStateAction<{
    activity_date: string
    duration_minutes: string
    notes: string
    rating: string
    weather_conditions: string
    partners: string
    climb_type: string
    climb_name: string
    climb_grade: string
    climb_location: string
    trail_name: string
    trail_level: string
    trail_time: string
    trail_distance: string
    mountain_name: string
    vertical_feet: string
    runs_completed: string
    run_distance: string
    run_time: string
    run_pace: string
    run_elevation_gain: string
    equipment_used: string[]
  }>>
  handleSportChange: (sport: string) => void
  handleEquipmentToggle: (equipmentId: string) => void
  handleSendSubmit: (e: React.FormEvent) => Promise<void>
  renderSportSpecificFields: () => JSX.Element | null
}) {
  const router = useRouter()
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

  // Local nutrition stats are now passed as props

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
  async function loadFoodData() {
    if (!user) {
      return
    }
    setIsLoadingFoods(true)
    try {
      const [foodItemsResult, templatesResult, savedFoodsResult] = await Promise.all([
        getFoodItems(),
        getMealTemplates(),
        getSavedFoods(user.id)
      ])

      console.log('Food data results:', {
        foodItems: Array.isArray(foodItemsResult) ? foodItemsResult.length : 'not array',
        templates: Array.isArray(templatesResult) ? templatesResult.length : 'not array',
        savedFoods: savedFoodsResult
      })

      setFoodItems(Array.isArray(foodItemsResult) ? foodItemsResult : [])
      setMealTemplates(Array.isArray(templatesResult) ? templatesResult : [])
      if (savedFoodsResult.success && Array.isArray(savedFoodsResult.data)) {
        setSavedFoods(savedFoodsResult.data)
      } else {
        setSavedFoods([])
      }
    } catch (error) {
      console.error('Error loading food data:', error)
      // Set empty arrays on error
      setFoodItems([])
      setMealTemplates([])
      setSavedFoods([])
    } finally {
      setIsLoadingFoods(false)
    }
  }

  const addFoodToMeal = (food: FoodItem) => {
    setSelectedFoods(prev => [...prev, { food, quantity: food.serving_size }])
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
      setSelectedFoods(prev => [...prev, { food: savedFood.food_item!, quantity: savedFood.food_item!.serving_size }])
    }
  }

  const handleQuickLogMeal = async () => {
    if (selectedFoods.length === 0) return

    try {
      // Use local date instead of UTC to avoid timezone issues
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const localDate = `${year}-${month}-${day}`
      
      const mealData = new FormData()
      mealData.append('meal_type', 'snack')
      mealData.append('meal_date', localDate)

      // Add meal items
      selectedFoods.forEach(({ food, quantity }, index) => {
        mealData.append(`food_${index}`, food.id)
        mealData.append(`quantity_${index}`, quantity.toString())
      })

      const result = await logMeal(mealData)
      if (result.success) {
        // Update local nutrition stats immediately for better UX
        const newStats = selectedFoods.reduce(
          (acc, { food, quantity }) => {
            const multiplier = quantity / food.serving_size
            return {
              total_calories: acc.total_calories + (food.calories_per_serving * multiplier),
              total_protein: acc.total_protein + (food.protein_grams * multiplier),
              total_carbs: acc.total_carbs + (food.carbs_grams * multiplier),
              total_fat: acc.total_fat + (food.fat_grams * multiplier),
              total_fiber: acc.total_fiber + (food.fiber_grams * multiplier),
              meals_count: acc.meals_count // Don't increment per food item
            }
          },
          {
            total_calories: localNutritionStats.total_calories,
            total_protein: localNutritionStats.total_protein,
            total_carbs: localNutritionStats.total_carbs,
            total_fat: localNutritionStats.total_fat,
            total_fiber: localNutritionStats.total_fiber,
            meals_count: localNutritionStats.meals_count + 1 // Increment by 1 for the entire meal
          }
        )
        setLocalNutritionStats(newStats)

        alert('Meal logged successfully!')
        setSelectedFoods([])
        setFoodSelectorOpen(false)
        setFoodSelectorSearch('')
        // Refresh the page to sync with server data
        router.refresh()
      } else {
        alert('Failed to log meal: ' + result.error)
      }
    } catch (error) {
      console.error('Error logging meal:', error)
      alert('Failed to log meal: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Sync local stats with server data when it changes
  useEffect(() => {
    setLocalNutritionStats(data.dailyNutritionStats)
  }, [data.dailyNutritionStats])

  // Sync local hydration with server data when it changes
  useEffect(() => {
    // Note: localHydrationTotal is passed as prop, not set here
  }, [data.dailyHydrationTotal])

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
          <div className="bg-gradient-to-br from-white to-stone-50 rounded-2xl p-8 mb-12 border border-stone-200 shadow-lg">
            <h2 className="text-3xl font-bold text-stone-800 mb-8 text-center">
              📊 Today's Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Readiness Score */}
              <Link href="/readiness" className="bg-white rounded-xl p-6 text-center border border-stone-200 shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer block group">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white group-hover:animate-pulse">
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
                <h3 className="text-xl font-semibold text-stone-800 mb-2">
                  Readiness Score
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 font-semibold">
                  <span>⚡</span>
                  <span>View Details →</span>
                </div>
              </Link>

              {/* Today's Active Minutes */}
              <div className="bg-white rounded-xl p-6 text-center border border-stone-200 shadow-md hover:shadow-lg transition-all hover:scale-105 group">
                <div className="w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white group-hover:animate-pulse">
                  {data.workouts.filter(w => {
                    const workoutDate = new Date(w.workout_date);
                    const today = new Date();
                    return workoutDate.toDateString() === today.toDateString();
                  }).reduce((total, w) => total + w.duration_minutes, 0)}
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-2">
                  Today's Minutes
                </h3>
                <div className="flex items-center justify-center gap-2 text-sm text-sky-600 font-semibold">
                  <span>⏱️</span>
                  <span>Time active</span>
                </div>
              </div>

              {/* Today's Calories */}
              <div className="bg-white rounded-xl p-6 text-center border border-stone-200 shadow-md hover:shadow-lg transition-all hover:scale-105 group">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-bold text-white group-hover:animate-pulse">
                  {data.workouts.filter(w => {
                    const workoutDate = new Date(w.workout_date);
                    const today = new Date();
                    return workoutDate.toDateString() === today.toDateString();
                  }).reduce((total, w) => total + (w.calories_burned || 0), 0)}
                </div>
                <h3 className="text-xl font-semibold text-stone-800 mb-2">
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
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-stone-800 mb-8 text-center">
              🚀 Quick Access
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/nutrition" className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-6 text-white no-underline block transition-all hover:scale-105 shadow-lg hover:shadow-xl group">
                <div className="text-center">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">🥗</div>
                  <h3 className="text-xl font-bold mb-2">Nutrition</h3>
                  <p className="text-sm opacity-90 leading-tight">Log meals, track macros, fuel your adventures</p>
                </div>
              </Link>
              <Link href="/activities" className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl p-6 text-white no-underline block transition-all hover:scale-105 shadow-lg hover:shadow-xl group">
                <div className="text-center">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">🏔️</div>
                  <h3 className="text-xl font-bold mb-2">Activities</h3>
                  <p className="text-sm opacity-90 leading-tight">Track sends, monitor progress, conquer peaks</p>
                </div>
              </Link>
              <Link href="/training" className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white no-underline block transition-all hover:scale-105 shadow-lg hover:shadow-xl group">
                <div className="text-center">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">💪</div>
                  <h3 className="text-xl font-bold mb-2">Training</h3>
                  <p className="text-sm opacity-90 leading-tight">Plan strength training, build power</p>
                </div>
              </Link>
              <Link href="/equipment" className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white no-underline block transition-all hover:scale-105 shadow-lg hover:shadow-xl group">
                <div className="text-center">
                  <div className="text-5xl mb-3 group-hover:animate-bounce">🎒</div>
                  <h3 className="text-xl font-bold mb-2">Equipment</h3>
                  <p className="text-sm opacity-90 leading-tight">Manage gear, track maintenance</p>
                </div>
              </Link>
            </div>
          </div>


          {/* Nutrition Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-stone-800 mb-8 text-center">
              🍎 Daily Fuel Intake
            </h2>

            {/* Compact Nutrition Overview */}
            <div className="bg-gradient-to-br from-stone-50 to-emerald-50 rounded-xl p-8 shadow-lg border border-stone-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                {/* Calories */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {localNutritionStats.total_calories}
                  </div>
                  <div className="text-sm font-semibold text-stone-700 mb-3">
                    Calories
                  </div>
                  <div className="bg-stone-200 rounded-full h-4 overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((localNutritionStats.total_calories / (data.nutritionGoals.find(g => g.goal_type === 'daily_calories')?.target_value || 2200)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500">
                    Goal: {data.nutritionGoals.find(g => g.goal_type === 'daily_calories')?.target_value || 2200}
                  </div>
                </div>

                {/* Protein */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(localNutritionStats.total_protein)}g
                  </div>
                  <div className="text-sm font-semibold text-stone-700 mb-3">
                    Protein
                  </div>
                  <div className="bg-stone-200 rounded-full h-4 overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((localNutritionStats.total_protein / (data.nutritionGoals.find(g => g.goal_type === 'protein_target')?.target_value || 150)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500">
                    Goal: {data.nutritionGoals.find(g => g.goal_type === 'protein_target')?.target_value || 150}g
                  </div>
                </div>

                {/* Carbs */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 mb-2">
                    {Math.round(localNutritionStats.total_carbs)}g
                  </div>
                  <div className="text-sm font-semibold text-stone-700 mb-3">
                    Carbs
                  </div>
                  <div className="bg-stone-200 rounded-full h-4 overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((localNutritionStats.total_carbs / (data.nutritionGoals.find(g => g.goal_type === 'carb_target')?.target_value || 250)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500">
                    Goal: {data.nutritionGoals.find(g => g.goal_type === 'carb_target')?.target_value || 250}g
                  </div>
                </div>

                {/* Fat */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-600 mb-2">
                    {Math.round(localNutritionStats.total_fat)}g
                  </div>
                  <div className="text-sm font-semibold text-stone-700 mb-3">
                    Fat
                  </div>
                  <div className="bg-stone-200 rounded-full h-4 overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-cyan-400 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((localNutritionStats.total_fat / (data.nutritionGoals.find(g => g.goal_type === 'fat_target')?.target_value || 70)) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500">
                    Goal: {data.nutritionGoals.find(g => g.goal_type === 'fat_target')?.target_value || 70}g
                  </div>
                </div>

                {/* Hydration */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(localHydrationTotal)}ml
                  </div>
                  <div className="text-sm font-semibold text-stone-700 mb-3">
                    💧 Hydration
                  </div>
                  <div className="bg-stone-200 rounded-full h-4 overflow-hidden mb-2">
                    <div className="bg-gradient-to-r from-blue-400 to-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((localHydrationTotal / 3000) * 100, 100)}%` }}></div>
                  </div>
                  <div className="text-xs text-stone-500">
                    Goal: 3000ml
                  </div>
                </div>
              </div>

              {/* Meals Summary & Quick Actions */}
              <div className="mt-8 pt-6 border-t border-stone-300">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                  <div className="text-sm text-stone-600">
                    Meals logged today: <strong className="text-stone-800">{localNutritionStats.meals_count}</strong>
                  </div>
                  <div className="text-sm text-stone-600">
                    Fiber: <strong className="text-stone-800">{Math.round(localNutritionStats.total_fiber)}g</strong>
                  </div>
                </div>

                {/* Quick Add Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => {
                      setFoodSelectorOpen(true)
                      loadFoodData()
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    ⚡ Quick Add Food
                  </button>
                  <button
                    onClick={() => setShowHydrationModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    💧 Quick Add Water
                  </button>
                </div>
              </div>
            </div>
          </div>          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Activity Logs */}
            <div className="bg-gradient-to-br from-stone-50 to-emerald-50 rounded-xl p-8 shadow-lg border border-stone-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  📝 Activity Logs
                </h3>
                <button
                  onClick={() => setShowWorkoutModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  ➕ Log Activity
                </button>
              </div>

              {/* Activity Filter */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActivityFilter('All')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activityFilter === 'All'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    All Activities
                  </button>
                  {(user?.user_metadata?.activities || ['Climbing', 'MTB', 'Running', 'Skiing', 'Snowboarding', 'Cycling']).map((activity: string) => (
                    <button
                      key={activity}
                      onClick={() => setActivityFilter(activity)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        activityFilter === activity
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filteredSends = activityFilter === 'All'
                    ? data.sends
                    : data.sends.filter(send => send.sport.toLowerCase() === activityFilter.toLowerCase());
                  
                  return filteredSends.length > 0 ? filteredSends.slice(0, 3).map((send) => (
                    <ActivityItem
                      key={send.id}
                      send={send}
                      formatDate={formatDate}
                    />
                  )) : (
                    <div className="text-center py-8 text-stone-600">
                      <div className="text-4xl mb-4">🏃‍♂️</div>
                      <p className="text-stone-600 mb-2">No {activityFilter === 'All' ? '' : activityFilter.toLowerCase() + ' '}activities logged yet.</p>
                      <p className="text-stone-500 text-sm">Start your fitness journey!</p>
                    </div>
                  );
                })()}
              </div>

              {/* View All Activities Button */}
              <div className="mt-8 text-center">
                <button
                  onClick={() => router.push('/activities')}
                  className="bg-gradient-to-br from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700 text-white px-8 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
                >
                  📊 View All Activities
                </button>
              </div>
            </div>

            {/* Goals & Events */}
            <div className="bg-gradient-to-br from-stone-50 to-emerald-50 rounded-xl p-8 shadow-lg border border-stone-200">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  🎯 Goals & Events
                </h3>
                <button
                  onClick={() => router.push('/goals')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-md hover:shadow-lg"
                >
                  ⚙️ Manage
                </button>
              </div>

              <div className="space-y-8">
                {/* Goals */}
                {data.goals.filter(g => !['weekly_workouts', 'monthly_minutes', 'strength_goals'].includes(g.goal_type)).length > 0 ? (
                  <div>
                    <h4 className="text-lg font-semibold text-stone-800 mb-4">Active Goals</h4>
                    <div className="grid gap-4">
                      {data.goals.filter(g => !['weekly_workouts', 'monthly_minutes', 'strength_goals'].includes(g.goal_type)).slice(0, 2).map((goal) => (
                        <div key={goal.id} className="bg-white rounded-lg p-4 border border-stone-200 shadow-sm">
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
                            <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}></div>
                          </div>
                          <div className="flex justify-between text-sm text-stone-600">
                            <span>{Math.round((goal.current_value / goal.target_value) * 100)}% complete</span>
                            <span>{Math.max(0, Math.round(goal.target_value - goal.current_value))} to go</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-lg font-semibold text-stone-800 mb-4">Active Goals</h4>
                    <div className="bg-white rounded-lg p-8 text-center border border-stone-200 shadow-sm">
                      <div className="text-4xl mb-4">🎯</div>
                      <h3 className="text-lg font-semibold text-stone-800 mb-2">No Goals Yet</h3>
                      <p className="text-stone-600 mb-4">Create your first goal to start tracking your fitness objectives.</p>
                      <button
                        onClick={() => router.push('/goals')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Create Your First Goal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div className="mt-6 pt-6 border-t border-stone-300">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">
                  Upcoming Events
                </h4>
                {data.events.length > 0 ? (
                  <div className="space-y-2">
                    {data.events.slice(0, 3).map((event) => {
                      const eventDate = new Date(event.event_date)
                      const today = new Date()
                      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      
                      return (
                        <div key={event.id} className="bg-white rounded-lg p-3 border border-stone-200 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              �‍♂️ <strong>{event.event_name}</strong>
                              {event.distance && <span className="text-stone-500 ml-1">({event.distance})</span>}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              daysUntil > 0 ? 'bg-blue-100 text-blue-800' :
                              daysUntil === 0 ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {daysUntil > 0 ? `${daysUntil}d` :
                               daysUntil === 0 ? 'Today!' :
                               'Past'}
                            </span>
                          </div>
                          <div className="text-stone-500 text-xs mt-1">
                            📅 {eventDate.toLocaleDateString()}
                            {event.location && <span> • 📍 {event.location}</span>}
                          </div>
                        </div>
                      )
                    })}
                    {data.events.length > 3 && (
                      <div className="text-center pt-2">
                        <Link href="/goals" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
                          View all {data.events.length} events →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-stone-500 text-sm mb-2">No upcoming events</p>
                    <Link href="/goals" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
                      Add your first event →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Activity Logging Modal */}
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Log Activity</h2>
            <form onSubmit={handleSendSubmit}>
              {/* Sport Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Sport *
                </label>
                <select
                  value={selectedSport}
                  onChange={(e) => handleSportChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select a sport...</option>
                  <option value="climbing">🧗 Rock Climbing</option>
                  <option value="trail-running">🏃 Trail Running</option>
                  <option value="mtb">🚵 Mountain Biking</option>
                  <option value="skiing">🎿 Skiing</option>
                  <option value="snowboarding">🏂 Snowboarding</option>
                  <option value="hiking">🥾 Hiking</option>
                  <option value="cycling">🚴 Cycling</option>
                  <option value="strength">💪 Strength Training</option>
                  <option value="yoga">🧘 Yoga & Mobility</option>
                  <option value="core">🏋️ Core Workout</option>
                  <option value="swimming">🏊 Swimming</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Sport-Specific Fields */}
              {renderSportSpecificFields()}

              {/* Equipment Selection */}
              {selectedSport && data.equipment && data.equipment.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Equipment Used
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '150px',
                    overflow: 'auto',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px'
                  }}>
                    {data.equipment
                      .filter(equipment => {
                        if (selectedSport === 'climbing') return equipment.category?.sport === 'climbing';
                        if (selectedSport === 'mtb') return equipment.category?.sport === 'mtb';
                        if (selectedSport === 'skiing' || selectedSport === 'snowboarding') return equipment.category?.sport === 'skiing';
                        if (selectedSport === 'trail-running' || selectedSport === 'hiking') return equipment.category?.sport === 'running';
                        if (selectedSport === 'cycling') return equipment.category?.sport === 'cycling';
                        return false;
                      })
                      .map(equipment => (
                        <label key={equipment.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <input
                            type="checkbox"
                            checked={sendData.equipment_used?.includes(equipment.id) || false}
                            onChange={() => handleEquipmentToggle(equipment.id)}
                          />
                          {equipment.equipment_name}
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Notes (optional)
                </label>
                <textarea
                  value={sendData.notes || ''}
                  onChange={(e) => setSendData({ ...sendData, notes: e.target.value })}
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

              {/* Submit Buttons */}
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
                  {isSubmitting ? 'Logging...' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hydration Logging Modal */}
      {showHydrationModal && (
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
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>💧 Log Hydration</h2>
            <form action={onHydrationSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Amount (ml)
                </label>
                <input
                  type="number"
                  name="amount_ml"
                  required
                  min="1"
                  max="2000"
                  placeholder="e.g., 500"
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
                  Notes (optional)
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="e.g., During workout, with breakfast..."
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
                  onClick={() => setShowHydrationModal(false)}
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
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Logging...' : '💧 Log Water'}
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
                  fontSize: '0.8rem',
                  color: '#666',
                  marginBottom: '0.5rem',
                  maxHeight: '60px',
                  overflow: 'auto'
                }}>
                  {selectedFoods.map(({ food, quantity }, index) => (
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                      {food.name} - {quantity} {food.serving_unit} ({(quantity / food.serving_size).toFixed(1)} servings)
                    </div>
                  ))}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: '#666',
                  marginBottom: '1rem'
                }}>
                  Total: {selectedFoods.reduce((sum, { food, quantity }) => sum + (food.calories_per_serving * (quantity / food.serving_size)), 0).toFixed(0)} cal
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
  const [showHydrationModal, setShowHydrationModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Send/Activity logging states
  const [selectedSport, setSelectedSport] = useState<string>('climbing')
  const [sendData, setSendData] = useState({
    // General fields
    activity_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    rating: '',
    weather_conditions: '',
    partners: '',

    // Climbing specific
    climb_type: '',
    climb_name: '',
    climb_grade: '',
    climb_location: '',

    // MTB specific
    trail_name: '',
    trail_level: '',
    trail_time: '',
    trail_distance: '',

    // Skiing/Snowboarding specific
    mountain_name: '',
    vertical_feet: '',
    runs_completed: '',

    // Running specific
    run_distance: '',
    run_time: '',
    run_pace: '',
    run_elevation_gain: '',

    // Equipment used
    equipment_used: [] as string[]
  })

  // Local state for immediate UI updates
  const [localNutritionStats, setLocalNutritionStats] = useState(data.dailyNutritionStats)
  const [localHydrationTotal, setLocalHydrationTotal] = useState(data.dailyHydrationTotal)

  // Update local state when data changes
  useEffect(() => {
    setLocalNutritionStats(data.dailyNutritionStats)
    setLocalHydrationTotal(data.dailyHydrationTotal)
  }, [data.dailyNutritionStats, data.dailyHydrationTotal])

  // Function to refresh nutrition stats from server
  const refreshNutritionStats = async () => {
    try {
      // Use local date instead of UTC to match meal logging
      const today = (() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
      const [freshStats, freshHydrationTotal] = await Promise.all([
        getDailyNutritionStats(today),
        getDailyHydrationTotal(today)
      ])
      setLocalNutritionStats(freshStats)
      setLocalHydrationTotal(freshHydrationTotal)
    } catch (error) {
      console.error('Error refreshing nutrition stats:', error)
    }
  }

  // Load fresh nutrition data when component mounts
  useEffect(() => {
    if (user && !loading) {
      refreshNutritionStats()
    }
  }, [user, loading])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Refresh nutrition stats when component mounts (user navigates back to dashboard)
  useEffect(() => {
    if (!loading && user) {
      refreshNutritionStats()
    }
  }, [loading, user])

  // Refresh nutrition stats when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && !loading) {
        refreshNutritionStats()
      }
    }

    const handleFocus = () => {
      if (user && !loading) {
        refreshNutritionStats()
      }
    }

    // Listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nutritionDataUpdated' && user && !loading) {
        refreshNutritionStats()
      }
    }

    // Also refresh periodically every 30 seconds
    const interval = setInterval(() => {
      if (user && !loading && !document.hidden) {
        refreshNutritionStats()
      }
    }, 30000)

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [user, loading])

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

  // Send/Activity logging handlers
  const handleSportChange = (sport: string) => {
    setSelectedSport(sport)
    // Reset sport-specific fields when changing sports
    setSendData(prev => ({
      ...prev,
      // Reset all sport-specific fields
      climb_type: '',
      climb_name: '',
      climb_grade: '',
      climb_location: '',
      trail_name: '',
      trail_level: '',
      trail_time: '',
      trail_distance: '',
      mountain_name: '',
      vertical_feet: '',
      runs_completed: '',
      run_distance: '',
      run_time: '',
      run_pace: '',
      run_elevation_gain: '',
      equipment_used: []
    }))
  }

  const handleEquipmentToggle = (equipmentId: string) => {
    setSendData(prev => ({
      ...prev,
      equipment_used: prev.equipment_used.includes(equipmentId)
        ? prev.equipment_used.filter(id => id !== equipmentId)
        : [...prev.equipment_used, equipmentId]
    }))
  }

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const sendPayload = {
        sport: selectedSport,
        activity_date: sendData.activity_date,
        duration_minutes: sendData.duration_minutes ? parseInt(sendData.duration_minutes) : undefined,

        // Climbing specific
        climb_type: sendData.climb_type || undefined,
        climb_name: sendData.climb_name || undefined,
        climb_grade: sendData.climb_grade || undefined,
        climb_location: sendData.climb_location || undefined,

        // MTB specific
        trail_name: sendData.trail_name || undefined,
        trail_level: sendData.trail_level || undefined,
        trail_time: sendData.trail_time || undefined,
        trail_distance: sendData.trail_distance ? parseFloat(sendData.trail_distance) : undefined,

        // Skiing/Snowboarding specific
        mountain_name: sendData.mountain_name || undefined,
        vertical_feet: sendData.vertical_feet ? parseInt(sendData.vertical_feet) : undefined,
        runs_completed: sendData.runs_completed ? parseInt(sendData.runs_completed) : undefined,

        // Running specific
        run_distance: sendData.run_distance ? parseFloat(sendData.run_distance) : undefined,
        run_time: sendData.run_time || undefined,
        run_pace: sendData.run_pace || undefined,
        run_elevation_gain: sendData.run_elevation_gain ? parseInt(sendData.run_elevation_gain) : undefined,

        // Equipment and general fields
        equipment_used: sendData.equipment_used,
        notes: sendData.notes || undefined,
        rating: sendData.rating ? parseInt(sendData.rating) : undefined,
        weather_conditions: sendData.weather_conditions || undefined,
        partners: sendData.partners || undefined
      }

      const result = await createSend(sendPayload)

      if (result.success) {
        setSendData({
          activity_date: new Date().toISOString().split('T')[0],
          duration_minutes: '',
          notes: '',
          rating: '',
          weather_conditions: '',
          partners: '',
          climb_type: '',
          climb_name: '',
          climb_grade: '',
          climb_location: '',
          trail_name: '',
          trail_level: '',
          trail_time: '',
          trail_distance: '',
          mountain_name: '',
          vertical_feet: '',
          runs_completed: '',
          run_distance: '',
          run_time: '',
          run_pace: '',
          run_elevation_gain: '',
          equipment_used: []
        })
        setShowWorkoutModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Failed to log activity: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to log activity:', error)
      alert('Failed to log activity. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render sport-specific fields for the modal
  const renderSportSpecificFields = () => {
    const relevantEquipment = data.equipment.filter(eq =>
      eq.category?.sport === selectedSport || eq.category?.sport === 'general'
    )

    switch (selectedSport) {
      case 'climbing':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Climb Type
                </label>
                <select
                  value={sendData.climb_type}
                  onChange={(e) => setSendData({ ...sendData, climb_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="bouldering">Bouldering</option>
                  <option value="sport">Sport Climbing</option>
                  <option value="trad">Traditional</option>
                  <option value="alpine">Alpine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grade
                </label>
                <input
                  type="text"
                  value={sendData.climb_grade}
                  onChange={(e) => setSendData({ ...sendData, climb_grade: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="V5, 5.10a, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Climb Name
                </label>
                <input
                  type="text"
                  value={sendData.climb_name}
                  onChange={(e) => setSendData({ ...sendData, climb_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Route name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={sendData.climb_location}
                  onChange={(e) => setSendData({ ...sendData, climb_location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Crag or area"
                />
              </div>
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'mtb':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trail Name
                </label>
                <input
                  type="text"
                  value={sendData.trail_name}
                  onChange={(e) => setSendData({ ...sendData, trail_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Trail name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={sendData.trail_level}
                  onChange={(e) => setSendData({ ...sendData, trail_level: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time (HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={sendData.trail_time}
                  onChange={(e) => setSendData({ ...sendData, trail_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="01:23:45"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sendData.trail_distance}
                  onChange={(e) => setSendData({ ...sendData, trail_distance: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12.5"
                />
              </div>
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'skiing':
      case 'snowboarding':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mountain/Resort
                </label>
                <input
                  type="text"
                  value={sendData.mountain_name}
                  onChange={(e) => setSendData({ ...sendData, mountain_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mountain name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vertical Feet
                </label>
                <input
                  type="number"
                  value={sendData.vertical_feet}
                  onChange={(e) => setSendData({ ...sendData, vertical_feet: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Runs Completed
              </label>
              <input
                type="number"
                value={sendData.runs_completed}
                onChange={(e) => setSendData({ ...sendData, runs_completed: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15"
              />
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'running':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sendData.run_distance}
                  onChange={(e) => setSendData({ ...sendData, run_distance: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5.0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time (HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={sendData.run_time}
                  onChange={(e) => setSendData({ ...sendData, run_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00:25:30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pace (min/km)
                </label>
                <input
                  type="text"
                  value={sendData.run_pace}
                  onChange={(e) => setSendData({ ...sendData, run_pace: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5:00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Elevation Gain (ft)
                </label>
                <input
                  type="number"
                  value={sendData.run_elevation_gain}
                  onChange={(e) => setSendData({ ...sendData, run_elevation_gain: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const handleMealSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await logMeal(formData)
      if (result.success && result.data) {
        setShowMealModal(false)
        // Update local nutrition stats immediately for better UX
        const newMeal = result.data
        const newStats = {
          total_calories: localNutritionStats.total_calories + (newMeal.total_calories || 0),
          total_protein: localNutritionStats.total_protein + (newMeal.total_protein || 0),
          total_carbs: localNutritionStats.total_carbs + (newMeal.total_carbs || 0),
          total_fat: localNutritionStats.total_fat + (newMeal.total_fat || 0),
          total_fiber: localNutritionStats.total_fiber + (newMeal.total_fiber || 0),
          meals_count: localNutritionStats.meals_count + 1
        }
        setLocalNutritionStats(newStats)
        // Refresh the page to sync with server data after a short delay
        setTimeout(() => {
          router.refresh()
        }, 1000)
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

  const handleHydrationSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await logHydration(formData)
      if (result.success) {
        setShowHydrationModal(false)
        // Update local hydration total instead of reloading page
        const amount_ml = parseInt(formData.get('amount_ml') as string) || 0
        setLocalHydrationTotal((prev: number) => prev + amount_ml)
      } else {
        alert('Error logging hydration: ' + result.error)
      }
    } catch (error) {
      alert('Error logging hydration')
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
    showHydrationModal={showHydrationModal}
    setShowHydrationModal={setShowHydrationModal}
    onWorkoutSubmit={handleWorkoutSubmit}
    onMealSubmit={handleMealSubmit}
    onHealthSubmit={handleHealthSubmit}
    onHydrationSubmit={handleHydrationSubmit}
    isSubmitting={isSubmitting}
    localHydrationTotal={localHydrationTotal}
    localNutritionStats={localNutritionStats}
    setLocalNutritionStats={setLocalNutritionStats}
    user={user}
    loading={loading}
    selectedSport={selectedSport}
    setSelectedSport={setSelectedSport}
    sendData={sendData}
    setSendData={setSendData}
    handleSportChange={handleSportChange}
    handleEquipmentToggle={handleEquipmentToggle}
    handleSendSubmit={handleSendSubmit}
    renderSportSpecificFields={renderSportSpecificFields}
  />
}
