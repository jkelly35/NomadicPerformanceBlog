'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { logWorkout, Workout, Goal, HealthMetric } from '@/lib/fitness-data'

interface TrainingData {
  workouts: Workout[]
  goals: Goal[]
  healthMetrics: HealthMetric[]
  weeklyStats: {
    count: number
    totalMinutes: number
  }
}

interface TrainingClientProps {
  initialData: TrainingData
}

export default function TrainingClient({ initialData }: TrainingClientProps) {
  const [workouts] = useState<Workout[]>(initialData.workouts)
  const [goals] = useState<Goal[]>(initialData.goals)
  const [healthMetrics] = useState<HealthMetric[]>(initialData.healthMetrics)
  const [weeklyStats] = useState(initialData.weeklyStats)
  const [newWorkout, setNewWorkout] = useState({
    activity_type: '',
    duration_minutes: 0,
    intensity: 'medium' as 'low' | 'medium' | 'high',
    calories_burned: undefined as number | undefined,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('activity_type', newWorkout.activity_type)
      formData.append('duration_minutes', newWorkout.duration_minutes.toString())
      formData.append('intensity', newWorkout.intensity.charAt(0).toUpperCase() + newWorkout.intensity.slice(1)) // Convert to 'Low', 'Medium', 'High'
      if (newWorkout.calories_burned) {
        formData.append('calories_burned', newWorkout.calories_burned.toString())
      }
      formData.append('notes', newWorkout.notes)
      formData.append('workout_date', new Date().toISOString().split('T')[0])

      await logWorkout(formData)
      setNewWorkout({
        activity_type: '',
        duration_minutes: 0,
        intensity: 'medium',
        calories_burned: undefined,
        notes: ''
      })
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      console.error('Failed to log workout:', error)
      alert('Failed to log workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">💪 Training Dashboard</h1>
                <p className="text-blue-100 text-lg">Track your workouts, monitor progress, and achieve your fitness goals</p>
                <div className="flex items-center mt-4 space-x-4">
                  <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">🔥 Streak: {Math.round(Math.random() * 30)} days</span>
                  </div>
                  <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">🏆 Level: Advanced</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-6xl">🏃‍♂️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">This Week</p>
                <p className="text-3xl font-bold text-blue-600">{weeklyStats.count}</p>
                <p className="text-sm text-gray-500">Workouts completed</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🏋️‍♂️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Minutes</p>
                <p className="text-3xl font-bold text-green-600">{weeklyStats.totalMinutes}</p>
                <p className="text-sm text-gray-500">Time invested</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Goals</p>
                <p className="text-3xl font-bold text-purple-600">{goals.length}</p>
                <p className="text-sm text-gray-500">Goals in progress</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📅</span>
              Recent Workouts
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {workouts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏃‍♂️</div>
                  <p className="text-gray-500 text-lg">No workouts logged yet.</p>
                  <p className="text-gray-400">Start by logging your first workout below!</p>
                </div>
              ) : (
                workouts.map((workout) => (
                  <div key={workout.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">
                            {workout.activity_type.toLowerCase().includes('run') ? '🏃‍♂️' :
                             workout.activity_type.toLowerCase().includes('cycle') ? '🚴‍♂️' :
                             workout.activity_type.toLowerCase().includes('weight') ? '🏋️‍♂️' :
                             workout.activity_type.toLowerCase().includes('swim') ? '🏊‍♂️' : '💪'}
                          </span>
                          <h4 className="text-lg font-semibold text-gray-900">{workout.activity_type}</h4>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <span className="mr-1">📅</span>
                            {new Date(workout.workout_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <span className="mr-1">⏱️</span>
                            {workout.duration_minutes} min
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            workout.intensity === 'High' ? 'bg-red-100 text-red-800' :
                            workout.intensity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {workout.intensity}
                          </span>
                        </div>
                        {workout.notes && (
                          <p className="text-gray-600 text-sm italic mb-2">"{workout.notes}"</p>
                        )}
                        {workout.calories_burned && (
                          <div className="flex items-center text-sm text-orange-600 font-medium">
                            <span className="mr-1">🔥</span>
                            {workout.calories_burned} calories burned
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Workout Logging Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📝</span>
              Log New Workout
            </h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleLogWorkout} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">🏃‍♂️</span>
                    Activity Type
                  </label>
                  <input
                    type="text"
                    value={newWorkout.activity_type}
                    onChange={(e) => setNewWorkout({ ...newWorkout, activity_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., Running, Cycling, Weight Training"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">⏱️</span>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.duration_minutes}
                    onChange={(e) => setNewWorkout({ ...newWorkout, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">⚡</span>
                    Intensity Level
                  </label>
                  <select
                    value={newWorkout.intensity}
                    onChange={(e) => setNewWorkout({ ...newWorkout, intensity: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="low">🟢 Low - Light effort</option>
                    <option value="medium">🟡 Medium - Moderate effort</option>
                    <option value="high">🔴 High - Maximum effort</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="mr-2">🔥</span>
                    Calories Burned (optional)
                  </label>
                  <input
                    type="number"
                    value={newWorkout.calories_burned || ''}
                    onChange={(e) => setNewWorkout({ ...newWorkout, calories_burned: parseInt(e.target.value) || undefined })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    placeholder="Estimated calories"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">📝</span>
                  Notes (optional)
                </label>
                <textarea
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                  placeholder="How did the workout feel? Any observations?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging Workout...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">💪</span>
                    Log Workout
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
