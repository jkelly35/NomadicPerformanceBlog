import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import SendsClient from '@/components/SendsClient'

export default async function TrainingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial data for the sends page
  const [
    { data: sends },
    { data: equipment },
    { data: workouts },
    { data: goals }
  ] = await Promise.all([
    supabase.from('sends').select('*').order('activity_date', { ascending: false }).limit(20),
    supabase.from('equipment').select(`
      *,
      category:equipment_categories(*)
    `).eq('is_active', true),
    supabase.from('workouts').select('*').order('workout_date', { ascending: false }).limit(20),
    supabase.from('goals').select('*').eq('is_active', true)
  ])

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

  // Calculate send stats
  const sendStats = {
    totalSends: sends?.length || 0,
    sendsBySport: [] as { sport: string; count: number }[],
    recentActivity: [] as { date: string; count: number }[]
  }

  // Calculate sends by sport
  if (sends) {
    const sportCounts: { [key: string]: number } = {}
    sends.forEach(send => {
      sportCounts[send.sport] = (sportCounts[send.sport] || 0) + 1
    })
    sendStats.sendsBySport = Object.entries(sportCounts).map(([sport, count]) => ({ sport, count }))

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const recentSends = sends.filter(send => send.activity_date >= thirtyDaysAgo)
    const dateCounts: { [key: string]: number } = {}
    recentSends.forEach(send => {
      dateCounts[send.activity_date] = (dateCounts[send.activity_date] || 0) + 1
    })
    sendStats.recentActivity = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  return (
    <SendsClient
      initialData={{
        sends: sends || [],
        equipment: equipment || [],
        stats: sendStats,
        workouts: workouts || [],
        goals: goals || [],
        weeklyStats: weeklyWorkoutStats
      }}
    />
  )
}
