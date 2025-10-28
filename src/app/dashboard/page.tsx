import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import DashboardClient from './DashboardClient'
import {
  getRecentWorkouts,
  getHealthMetrics,
  getActiveGoals,
  getUserStats,
  getWeeklyWorkoutStats,
  Workout,
  HealthMetric,
  Goal,
  UserStat
} from '@/lib/fitness-data'

interface DashboardData {
  workouts: Workout[]
  healthMetrics: HealthMetric[]
  goals: Goal[]
  userStats: UserStat[]
  weeklyStats: { count: number; totalMinutes: number }
}

async function getDashboardData(): Promise<DashboardData> {
  // Fetch all dashboard data
  const [workouts, healthMetrics, goals, userStats, weeklyStats] = await Promise.all([
    getRecentWorkouts(5),
    getHealthMetrics(),
    getActiveGoals(),
    getUserStats(),
    getWeeklyWorkoutStats()
  ])

  return {
    workouts,
    healthMetrics,
    goals,
    userStats,
    weeklyStats
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
