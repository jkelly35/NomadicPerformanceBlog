'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Goal, Event as FitnessEvent, createCustomGoal, updateCustomGoal, deleteCustomGoal, createEvent, updateEvent, deleteEvent } from '@/lib/fitness-data'
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"

interface GoalsClientProps {
  goals: Goal[]
  events: FitnessEvent[]
}

export default function GoalsClient({ goals, events }: GoalsClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [showEditEventModal, setShowEditEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<FitnessEvent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle period field visibility for create form
  useEffect(() => {
    const handleCreateCheckboxChange = (e: Event) => {
      const checkbox = e.target as HTMLInputElement
      const periodField = document.getElementById('period-field')
      if (periodField) {
        periodField.style.display = checkbox.checked ? 'block' : 'none'
      }
    }

    const createCheckbox = document.querySelector('input[name="is_time_based"]:not([defaultChecked])')
    if (createCheckbox) {
      createCheckbox.addEventListener('change', handleCreateCheckboxChange)
      // Set initial state
      const periodField = document.getElementById('period-field')
      if (periodField) {
        periodField.style.display = (createCheckbox as HTMLInputElement).checked ? 'block' : 'none'
      }
    }

    return () => {
      if (createCheckbox) {
        createCheckbox.removeEventListener('change', handleCreateCheckboxChange)
      }
    }
  }, [showCreateModal])

  // Handle period field visibility for edit form
  useEffect(() => {
    const handleEditCheckboxChange = (e: Event) => {
      const checkbox = e.target as HTMLInputElement
      const periodField = document.getElementById('edit-period-field')
      if (periodField) {
        periodField.style.display = checkbox.checked ? 'block' : 'none'
      }
    }

    const editCheckbox = document.querySelector('input[name="is_time_based"][defaultChecked]')
    if (editCheckbox) {
      editCheckbox.addEventListener('change', handleEditCheckboxChange)
    }

    return () => {
      if (editCheckbox) {
        editCheckbox.removeEventListener('change', handleEditCheckboxChange)
      }
    }
  }, [showEditModal, editingGoal])

  const handleGoalSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const goalType = formData.get('goal_type') as string
      const targetValue = parseFloat(formData.get('target_value') as string)
      const period = formData.get('period') as string
      const isTimeBased = formData.get('is_time_based') === 'on'
      const description = formData.get('description') as string
      const targetDate = formData.get('target_date') as string
      const category = formData.get('category') as string
      const priority = formData.get('priority') as 'low' | 'medium' | 'high'

      if (!goalType || !targetValue) {
        alert('Please fill in all required fields')
        return
      }

      if (isTimeBased && !period) {
        alert('Period is required for time-based goals')
        return
      }

      const result = await createCustomGoal({
        goal_type: goalType,
        target_value: targetValue,
        period: isTimeBased ? period : undefined,
        description: description || undefined,
        target_date: targetDate || undefined,
        category: category || undefined,
        priority: priority
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

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowEditModal(true)
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteCustomGoal(goalId)
      if (result.success) {
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        alert('Error deleting goal: ' + result.error)
      }
    } catch (error) {
      alert('Error deleting goal')
    }
  }

  const handleEditSubmit = async (formData: FormData) => {
    if (!editingGoal) return

    setIsSubmitting(true)
    try {
      const goalType = formData.get('goal_type') as string
      const targetValue = parseFloat(formData.get('target_value') as string)
      const period = formData.get('period') as string
      const isTimeBased = formData.get('is_time_based') === 'on'
      const description = formData.get('description') as string
      const targetDate = formData.get('target_date') as string
      const category = formData.get('category') as string
      const priority = formData.get('priority') as 'low' | 'medium' | 'high'

      if (!goalType || !targetValue) {
        alert('Please fill in all required fields')
        return
      }

      if (isTimeBased && !period) {
        alert('Period is required for time-based goals')
        return
      }

      const result = await updateCustomGoal(editingGoal.id, {
        goal_type: goalType,
        target_value: targetValue,
        period: isTimeBased ? period : undefined,
        description: description || undefined,
        target_date: targetDate || undefined,
        category: category || undefined,
        priority: priority
      })

      if (result.success) {
        setShowEditModal(false)
        setEditingGoal(null)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        alert('Error updating goal: ' + result.error)
      }
    } catch (error) {
      alert('Error updating goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Event handlers
  const handleEventSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const eventName = formData.get('event_name') as string
      const eventDate = formData.get('event_date') as string
      const eventType = formData.get('event_type') as string
      const location = formData.get('location') as string
      const description = formData.get('description') as string
      const distance = formData.get('distance') as string
      const targetTime = formData.get('target_time') as string

      if (!eventName || !eventDate) {
        alert('Please fill in all required fields')
        return
      }

      const result = await createEvent({
        event_name: eventName,
        event_date: eventDate,
        event_type: eventType || undefined,
        location: location || undefined,
        description: description || undefined,
        distance: distance || undefined,
        target_time: targetTime || undefined
      })

      if (result.success) {
        setShowCreateEventModal(false)
        window.location.reload()
      } else {
        alert('Error creating event: ' + result.error)
      }
    } catch (error) {
      alert('Error creating event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditEventSubmit = async (formData: FormData) => {
    if (!editingEvent) return

    setIsSubmitting(true)
    try {
      const eventName = formData.get('event_name') as string
      const eventDate = formData.get('event_date') as string
      const eventType = formData.get('event_type') as string
      const location = formData.get('location') as string
      const description = formData.get('description') as string
      const distance = formData.get('distance') as string
      const targetTime = formData.get('target_time') as string

      if (!eventName || !eventDate) {
        alert('Please fill in all required fields')
        return
      }

      const result = await updateEvent(editingEvent.id, {
        event_name: eventName,
        event_date: eventDate,
        event_type: eventType || undefined,
        location: location || undefined,
        description: description || undefined,
        distance: distance || undefined,
        target_time: targetTime || undefined
      })

      if (result.success) {
        setShowEditEventModal(false)
        setEditingEvent(null)
        window.location.reload()
      } else {
        alert('Error updating event: ' + result.error)
      }
    } catch (error) {
      alert('Error updating event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const result = await deleteEvent(eventId)
      if (result.success) {
        window.location.reload()
      } else {
        alert('Error deleting event: ' + result.error)
      }
    } catch (error) {
      alert('Error deleting event')
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
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-800 text-xl mb-2">
                        🎯 {goal.goal_type}
                      </h3>
                      {goal.description && (
                        <p className="text-stone-600 text-sm mb-2">{goal.description}</p>
                      )}
                      <p className="text-stone-600">
                        {Math.round(goal.current_value)} of {Math.round(goal.target_value)}
                        {goal.period && ` (${goal.period})`}
                      </p>
                      {goal.target_date && (
                        <p className="text-stone-500 text-xs mt-1">
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (goal.current_value / goal.target_value) * 100 >= 100 ? 'bg-green-100 text-green-800' :
                        (goal.current_value / goal.target_value) * 100 >= 75 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {(goal.current_value / goal.target_value) * 100 >= 100 ? '✅ Complete' :
                         (goal.current_value / goal.target_value) * 100 >= 75 ? '🚀 Almost there' :
                         '🎯 In progress'}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          🗑️ Delete
                        </button>
                      </div>
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

        {/* Events Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-stone-800 mb-2">🏃‍♂️ Upcoming Events</h2>
              <p className="text-stone-600">Track your races, competitions, and fitness events</p>
            </div>
            <button
              onClick={() => setShowCreateEventModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Add Event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-lg border border-stone-200">
              <div className="text-6xl mb-4">🏃‍♂️</div>
              <h3 className="text-xl font-semibold text-stone-800 mb-2">No upcoming events</h3>
              <p className="text-stone-600 mb-6">Add your first race or competition to start tracking.</p>
              <button
                onClick={() => setShowCreateEventModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Add Your First Event
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const eventDate = new Date(event.event_date)
                const today = new Date()
                const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                
                return (
                  <div key={event.id} className="bg-white rounded-xl p-6 shadow-lg border border-stone-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-800 text-xl mb-2">
                          🏃‍♂️ {event.event_name}
                        </h3>
                        {event.description && (
                          <p className="text-stone-600 text-sm mb-2">{event.description}</p>
                        )}
                        <div className="space-y-1 text-sm text-stone-600">
                          <p>📅 {eventDate.toLocaleDateString()}</p>
                          {event.location && <p>📍 {event.location}</p>}
                          {event.distance && <p>📏 {event.distance}</p>}
                          {event.target_time && <p>⏱️ Target: {event.target_time}</p>}
                        </div>
                        <div className="mt-3">
                          {daysUntil > 0 ? (
                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                              {daysUntil} days until event
                            </span>
                          ) : daysUntil === 0 ? (
                            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                              Today!
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                              Past event
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => {
                            setEditingEvent(event)
                            setShowEditEventModal(true)
                          }}
                          className="text-stone-500 hover:text-stone-700 p-1"
                          title="Edit event"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete event"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
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
                    Goal Type *
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
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Optional description of your goal..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      name="is_time_based"
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Is this a time-based goal? (e.g., weekly workouts, monthly miles)
                  </label>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                    Leave unchecked for goals like weight loss that track progress manually
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Target Value *
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

                  <div id="period-field" style={{ flex: 1, display: 'none' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Period *
                    </label>
                    <select
                      name="period"
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
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Target Date
                    </label>
                    <input
                      type="date"
                      name="target_date"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Category
                    </label>
                    <select
                      name="category"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Select category...</option>
                      <option value="fitness">Fitness</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="endurance">Endurance</option>
                      <option value="strength">Strength</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="weight">Weight Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue="medium"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
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

        {/* Edit Goal Modal */}
        {showEditModal && editingGoal && (
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
              <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Edit Goal</h2>
              <form action={handleEditSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Goal Type *
                  </label>
                  <input
                    type="text"
                    name="goal_type"
                    required
                    defaultValue={editingGoal.goal_type}
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
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingGoal.description || ''}
                    placeholder="Optional description of your goal..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                    <input
                      type="checkbox"
                      name="is_time_based"
                      defaultChecked={!!editingGoal.period}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Is this a time-based goal? (e.g., weekly workouts, monthly miles)
                  </label>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                    Leave unchecked for goals like weight loss that track progress manually
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Target Value *
                    </label>
                    <input
                      type="number"
                      name="target_value"
                      required
                      min="1"
                      step="0.1"
                      defaultValue={editingGoal.target_value}
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

                  <div id="edit-period-field" style={{ flex: 1, display: editingGoal.period ? 'block' : 'none' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Period *
                    </label>
                    <select
                      name="period"
                      defaultValue={editingGoal.period || ''}
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
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Target Date
                    </label>
                    <input
                      type="date"
                      name="target_date"
                      defaultValue={editingGoal.target_date ? editingGoal.target_date.split('T')[0] : ''}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                      Category
                    </label>
                    <select
                      name="category"
                      defaultValue={editingGoal.category || ''}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="">Select category...</option>
                      <option value="fitness">Fitness</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="endurance">Endurance</option>
                      <option value="strength">Strength</option>
                      <option value="flexibility">Flexibility</option>
                      <option value="weight">Weight Management</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Priority
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingGoal.priority || 'medium'}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingGoal(null)
                    }}
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
                    {isSubmitting ? 'Updating...' : 'Update Goal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Add New Event</h2>
              <form action={handleEventSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="event_name"
                    required
                    placeholder="e.g., Boston Marathon, Local 5K"
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
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    required
                    min={new Date().toISOString().split('T')[0]}
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
                    Event Type
                  </label>
                  <select
                    name="event_type"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select event type...</option>
                    <option value="marathon">Marathon</option>
                    <option value="half-marathon">Half Marathon</option>
                    <option value="race">Race</option>
                    <option value="triathlon">Triathlon</option>
                    <option value="competition">Competition</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="City, State or Venue"
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
                    Distance
                  </label>
                  <input
                    type="text"
                    name="distance"
                    placeholder="e.g., 26.2 miles, 5K, 10K"
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
                    Target Time
                  </label>
                  <input
                    type="text"
                    name="target_time"
                    placeholder="e.g., 3:30:00, sub-20 minutes"
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
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Optional description or notes..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateEventModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#fff',
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
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditEventModal && editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Edit Event</h2>
              <form action={handleEditEventSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Event Name *
                  </label>
                  <input
                    type="text"
                    name="event_name"
                    required
                    defaultValue={editingEvent.event_name}
                    placeholder="e.g., Boston Marathon, Local 5K"
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
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    required
                    defaultValue={editingEvent.event_date.split('T')[0]}
                    min={new Date().toISOString().split('T')[0]}
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
                    Event Type
                  </label>
                  <select
                    name="event_type"
                    defaultValue={editingEvent.event_type || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Select event type...</option>
                    <option value="marathon">Marathon</option>
                    <option value="half-marathon">Half Marathon</option>
                    <option value="race">Race</option>
                    <option value="triathlon">Triathlon</option>
                    <option value="competition">Competition</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={editingEvent.location || ''}
                    placeholder="City, State or Venue"
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
                    Distance
                  </label>
                  <input
                    type="text"
                    name="distance"
                    defaultValue={editingEvent.distance || ''}
                    placeholder="e.g., 26.2 miles, 5K, 10K"
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
                    Target Time
                  </label>
                  <input
                    type="text"
                    name="target_time"
                    defaultValue={editingEvent.target_time || ''}
                    placeholder="e.g., 3:30:00, sub-20 minutes"
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
                    Description
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingEvent.description || ''}
                    placeholder="Optional description or notes..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditEventModal(false)
                      setEditingEvent(null)
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      background: '#fff',
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
                      background: '#059669',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Event'}
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
