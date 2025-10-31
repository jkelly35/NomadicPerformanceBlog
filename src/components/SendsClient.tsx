'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Workout } from '@/lib/fitness-data'
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"

interface SendsClientProps {
  workouts: Workout[]
}

export default function SendsClient({ workouts }: SendsClientProps) {
  const [filter, setFilter] = useState<string>('all')

  const filteredWorkouts = filter === 'all'
    ? workouts
    : workouts.filter(workout => workout.activity_type?.toLowerCase() === filter.toLowerCase())

  const activityTypes = Array.from(new Set(workouts.map(w => w.activity_type).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-emerald-50">
      <NavBar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-stone-800 mb-2">🏔️ My Sends</h1>
              <p className="text-stone-600 text-lg">Track your outdoor adventures and achievements</p>
            </div>
            <Link
              href="/dashboard"
              className="bg-stone-600 hover:bg-stone-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              All Activities
            </button>
            {activityTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Sends Section */}
        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-6">Your Activity Log</h2>
          {filteredWorkouts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-lg border border-stone-200">
              <div className="text-6xl mb-4">🏔️</div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">No Sends Yet</h3>
              <p className="text-stone-600 mb-6">Log your first outdoor adventure to start tracking your sends.</p>
              <Link
                href="/dashboard"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
              >
                Log Your First Send
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredWorkouts.map((workout) => (
                <div key={workout.id} className="bg-white rounded-xl p-6 shadow-lg border border-stone-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-stone-800 text-xl mb-2">
                        {workout.activity_type === 'climb' && '🧗‍♂️'}
                        {workout.activity_type === 'hike' && '🥾'}
                        {workout.activity_type === 'run' && '🏃‍♂️'}
                        {workout.activity_type === 'ski' && '🎿'}
                        {!workout.activity_type && '💪'}
                        {' '}
                        {workout.activity_type || 'Workout'}
                      </h3>
                      <p className="text-stone-600 text-sm">
                        {new Date(workout.workout_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        {workout.duration_minutes} min
                      </div>
                      {workout.calories_burned && (
                        <div className="text-sm text-stone-500">
                          {workout.calories_burned} cal
                        </div>
                      )}
                    </div>
                  </div>

                  {workout.notes && (
                    <p className="text-stone-600 text-sm mb-3 italic">
                      "{workout.notes}"
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {workout.activity_type && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                        {workout.activity_type}
                      </span>
                    )}
                    {workout.intensity && (
                      <span className="px-2 py-1 bg-stone-100 text-stone-800 text-xs rounded-full">
                        {workout.intensity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
