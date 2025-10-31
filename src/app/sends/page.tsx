import { createClient } from '@/lib/supabase-server'
import { getWorkouts } from '@/lib/fitness-data'
import SendsClient from '@/components/SendsClient'

export default async function SendsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-800 mb-4">Access Denied</h1>
          <p className="text-stone-600">Please log in to view your sends.</p>
        </div>
      </div>
    )
  }

  // Fetch user's workouts/sends
  const workouts = await getWorkouts()

  return <SendsClient workouts={workouts} />
}
