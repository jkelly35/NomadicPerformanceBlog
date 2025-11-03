import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import BottomNavigation from '@/components/BottomNavigation'
import TrainingDashboard from '@/components/TrainingDashboard'
import { checkDashboardAccess } from '@/lib/dashboard-access'

export default async function TrainingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if training dashboard is accessible
  const hasAccess = await checkDashboardAccess('training')
  if (!hasAccess) {
    redirect('/dashboard')
  }

  // Fetch workout data
  const { data: workouts } = await supabase
    .from('workouts')
    .select('*')
    .order('workout_date', { ascending: false })
    .limit(20)

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('is_active', true)

  // Calculate weekly workout stats
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const weeklyStats = await supabase
    .from('workouts')
    .select('duration_minutes')
    .gte('workout_date', sevenDaysAgo)

  const weeklyWorkoutStats = {
    count: weeklyStats.data?.length || 0,
    totalMinutes: weeklyStats.data?.reduce((sum: number, workout: any) => sum + (workout.duration_minutes || 0), 0) || 0
  }

  return (
    <div>
      <NavBar />
      <TrainingDashboard
        initialWorkouts={workouts || []}
        initialGoals={goals || []}
        initialWeeklyStats={weeklyWorkoutStats}
      />
      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </div>
  )
}
