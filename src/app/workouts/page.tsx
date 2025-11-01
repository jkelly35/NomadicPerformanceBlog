import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

export default async function WorkoutsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-white">💪 Training Dashboard</h1>
            <p className="text-blue-100 text-lg">Plan strength training, track exercises, and build power</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Quick Stats */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Total Workouts</h3>
              <p className="text-3xl font-bold text-blue-400">{workouts?.length || 0}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Active Goals</h3>
              <p className="text-3xl font-bold text-green-400">{goals?.length || 0}</p>
            </div>

            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">This Week</h3>
              <p className="text-3xl font-bold text-purple-400">
                {workouts?.filter(w => {
                  const workoutDate = new Date(w.workout_date)
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  return workoutDate >= weekAgo
                }).length || 0}
              </p>
            </div>
          </div>

          {/* Recent Workouts */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Workouts</h2>
            {workouts && workouts.length > 0 ? (
              <div className="space-y-4">
                {workouts.slice(0, 5).map((workout: any) => (
                  <div key={workout.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{workout.workout_name || 'Workout'}</h3>
                        <p className="text-blue-200 text-sm">{new Date(workout.workout_date).toLocaleDateString()}</p>
                        {workout.duration_minutes && (
                          <p className="text-green-200 text-sm">{workout.duration_minutes} minutes</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-yellow-400 font-semibold">
                          {workout.workout_type || 'Strength Training'}
                        </span>
                      </div>
                    </div>
                    {workout.notes && (
                      <p className="text-gray-300 text-sm mt-2">{workout.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No workouts logged yet. Start building your strength!</p>
            )}
          </div>

          {/* Active Goals */}
          {goals && goals.length > 0 && (
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mt-6">
              <h2 className="text-2xl font-bold text-white mb-4">Active Training Goals</h2>
              <div className="space-y-4">
                {goals.map((goal: any) => (
                  <div key={goal.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-lg font-semibold text-white">{goal.goal_name}</h3>
                    <p className="text-blue-200 text-sm">{goal.description}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm text-gray-300">
                        <span>Target: {goal.target_value} {goal.target_unit}</span>
                        <span>Current: {goal.current_value || 0} {goal.target_unit}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((goal.current_value || 0) / goal.target_value * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
