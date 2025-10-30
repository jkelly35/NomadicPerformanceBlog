import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import TrainingClient from '@/components/TrainingClient'

export default async function TrainingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch initial data for the training page
  const [
    { data: workouts },
    { data: goals },
    { data: healthMetrics }
  ] = await Promise.all([
    supabase.from('workouts').select('*').order('workout_date', { ascending: false }).limit(20),
    supabase.from('goals').select('*').eq('is_active', true),
    supabase.from('health_metrics').select('*').order('date', { ascending: false }).limit(10)
  ])

  // Calculate weekly workout stats
  const weeklyStats = await supabase
    .from('workouts')
    .select('duration_minutes')
    .gte('workout_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

  const weeklyWorkoutStats = {
    count: weeklyStats.data?.length || 0,
    totalMinutes: weeklyStats.data?.reduce((sum, workout) => sum + (workout.duration_minutes || 0), 0) || 0
  }

  return (
    <TrainingClient
      initialData={{
        workouts: workouts || [],
        goals: goals || [],
        healthMetrics: healthMetrics || [],
        weeklyStats: weeklyWorkoutStats
      }}
    />
  )
}
