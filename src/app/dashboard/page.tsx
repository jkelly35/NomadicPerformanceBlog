import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import DashboardClient from '@/components/DashboardClient'
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
  getDailyHydrationTotal
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
  dailyHydrationTotal: number
}

async function getDashboardData(): Promise<DashboardData> {
  const today = new Date().toISOString().split('T')[0]

  // Fetch all dashboard data
  const [workouts, healthMetrics, goals, userStats, weeklyStats, meals, nutritionGoals, dailyNutritionStats, dailyHydrationTotal] = await Promise.all([
    getRecentWorkouts(5),
    getHealthMetrics(),
    getActiveGoals(),
    getUserStats(),
    getWeeklyWorkoutStats(),
    getMealsByDate(today),
    getNutritionGoals(),
    getDailyNutritionStats(today),
    getDailyHydrationTotal(today)
  ])

  return {
    workouts,
    healthMetrics,
    goals,
    userStats,
    weeklyStats,
    meals,
    nutritionGoals,
    dailyNutritionStats,
    dailyHydrationTotal
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

  return <DashboardClient data={data} />
}
