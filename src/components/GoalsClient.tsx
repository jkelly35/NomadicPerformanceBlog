'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Goal, createCustomGoal } from '@/lib/fitness-data'
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"

interface GoalsClientProps {
  goals: Goal[]
}

export default function GoalsClient({ goals }: GoalsClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleGoalSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const goalType = formData.get('goal_type') as string
      const targetValue = parseFloat(formData.get('target_value') as string)
      const period = formData.get('period') as string

      if (!goalType || !targetValue || !period) {
        alert('Please fill in all required fields')
        return
      }

      const result = await createCustomGoal({
        goal_type: goalType,
        target_value: targetValue,
        period: period
      })

      if (result.success) {
        setShowCreateModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error creating goal: ' + result.error)
      }
    } catch (error) {
      alert('Error creating goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const userGoals = goals.filter(g => !['weekly_workouts', 'monthly_minutes', 'strength_goals'].includes(g.goal_type))

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-emerald-50">
      <NavBar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-stone-800 mb-2">🎯 My Goals</h1>
              <p className="text-stone-600 text-lg">Create and track your personal fitness goals</p>
            </div>
            <Link
              href="/dashboard"
              className="bg-stone-600 hover:bg-stone-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Create Goal Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors flex items-center gap-2"
          >
            ➕ Create New Goal
          </button>
        </div>

        {/* Goals Section */}
        <section>
          <h2 className="text-2xl font-bold text-stone-800 mb-6"> Your Goals</h2>
          {userGoals.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-lg border border-stone-200">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">No Goals Yet</h3>
              <p className="text-stone-600 mb-6">Create your first goal to start tracking your fitness objectives.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userGoals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-xl p-6 shadow-lg border border-stone-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-stone-800 text-xl mb-2">
                        🎯 {goal.goal_type}
                      </h3>
                      <p className="text-stone-600">
                        {Math.round(goal.current_value)} of {Math.round(goal.target_value)} ({goal.period})
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      (goal.current_value / goal.target_value) * 100 >= 100 ? 'bg-green-100 text-green-800' :
                      (goal.current_value / goal.target_value) * 100 >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(goal.current_value / goal.target_value) * 100 >= 100 ? '✅ Complete' :
                       (goal.current_value / goal.target_value) * 100 >= 75 ? '🚀 Almost there' :
                       '🎯 In progress'}
                    </div>
                  </div>
                  <div className="bg-stone-200 rounded-full h-4 overflow-hidden mb-3">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>{Math.round((goal.current_value / goal.target_value) * 100)}% complete</span>
                    <span>{Math.max(0, Math.round(goal.target_value - goal.current_value))} to go</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Create New Goal</h2>
              <form action={handleGoalSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Goal Type
                  </label>
                  <input
                    type="text"
                    name="goal_type"
                    required
                    placeholder="e.g., Monthly Hiking Miles, Weekly Yoga Sessions"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Target Value
                  </label>
                  <input
                    type="number"
                    name="target_value"
                    required
                    min="1"
                    step="0.1"
                    placeholder="e.g., 50, 10, 1000"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Period
                  </label>
                  <select
                    name="period"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select period...</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#f8f9fa',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                      color: '#fff',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
