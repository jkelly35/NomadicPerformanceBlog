import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import SkeletonLoader from '@/components/SkeletonLoader'
import ErrorBoundary from '@/components/ErrorBoundary'
import {
  getRecentWorkouts,
  getHealthMetrics,
  getActiveGoals,
  getUserStats,
  getWeeklyWorkoutStats,
  Workout,
  HealthMetric,
  Goal,
  UserStat,
  getMealsByDate,
  getNutritionGoals,
  getDailyNutritionStats,
  Meal,
  NutritionGoal,
  getDailyHydrationTotal,
  getActiveEvents,
  Event as FitnessEvent,
  Equipment,
  getUserEquipment,
  getRecentSends,
  Send,
  getDailyCaffeineTotal
} from '@/lib/fitness-data'

// Dynamically import the heavy DashboardClient component
const DashboardClient = dynamic(() => import('@/components/DashboardClient'), {
  loading: () => <SkeletonLoader type="dashboard" />
})

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
  dailyCaffeineTotal: number
  equipment: Equipment[]
}

async function getDashboardData(): Promise<DashboardData> {
  // Use local date instead of UTC to match meal logging
  const today = (() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  // Fetch all dashboard data
  const [workouts, sends, healthMetrics, goals, events, userStats, weeklyStats, meals, nutritionGoals, dailyNutritionStats, dailyHydrationTotal, dailyCaffeineTotal, equipment] = await Promise.all([
    getRecentWorkouts(5),
    getRecentSends(5),
    getHealthMetrics(),
    getActiveGoals(),
    getActiveEvents(),
    getUserStats(),
    getWeeklyWorkoutStats(),
    getMealsByDate(today),
    getNutritionGoals(),
    getDailyNutritionStats(today),
    getDailyHydrationTotal(today),
    getDailyCaffeineTotal(today),
    getUserEquipment()
  ])

  return {
    workouts,
    sends,
    healthMetrics,
    goals,
    events,
    userStats,
    weeklyStats,
    meals,
    nutritionGoals,
    dailyNutritionStats,
    dailyHydrationTotal,
    dailyCaffeineTotal,
    equipment
  }
}

export default async function DashboardPage() {
  // Check authentication on server side
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch dashboard data on server side
  const data = await getDashboardData()

  return (
    <ErrorBoundary>
      <Suspense fallback={<SkeletonLoader type="dashboard" />}>
        <DashboardClient data={data} />
      </Suspense>
    </ErrorBoundary>
  )
}
