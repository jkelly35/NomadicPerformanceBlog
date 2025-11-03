import { createClient } from '@/lib/supabase-server'
import { getActiveGoals, getActiveEvents } from '@/lib/fitness-data'
import GoalsClient from '@/components/GoalsClient'
import { checkDashboardAccess } from '@/lib/dashboard-access'
import { redirect } from 'next/navigation'

export default async function GoalsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Access Denied</h1>
          <p className="text-stone-600">Please log in to view your goals.</p>
        </div>
      </div>
    )
  }

  // Check if goals dashboard is accessible
  const hasAccess = await checkDashboardAccess('goals')
  if (!hasAccess) {
    redirect('/dashboard')
  }

  // Fetch user's goals and events
  const goals = await getActiveGoals()
  const events = await getActiveEvents()

  return <GoalsClient goals={goals} events={events} />
}
