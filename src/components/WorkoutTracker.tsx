'use client'

import { useState, useEffect } from 'react'
import { StrengthWorkout, WorkoutExercise, ExerciseSet, Exercise, getExercises, createStrengthWorkout, updateStrengthWorkout, addExerciseSet, updateExerciseSet } from '@/lib/fitness-data'

interface WorkoutTrackerProps {
  initialWorkout?: Partial<StrengthWorkout>
  planDay?: any // Training day from plan
  onSave?: (workout: StrengthWorkout) => void
  onCancel?: () => void
}

export default function WorkoutTracker({ initialWorkout, planDay, onSave, onCancel }: WorkoutTrackerProps) {
  const [workout, setWorkout] = useState<Partial<StrengthWorkout>>({
    workout_date: new Date().toISOString().split('T')[0],
    name: planDay?.name || 'Workout',
    exercises: [],
    completed: false,
    ...initialWorkout
  })

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showExerciseSelector, setShowExerciseSelector] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadExercises()
    if (planDay) {
      initializeFromPlan()
    }
  }, [planDay])

  const loadExercises = async () => {
    const data = await getExercises()
    setExercises(data)
  }

  const initializeFromPlan = () => {
    if (!planDay?.exercises) return

    const workoutExercises: WorkoutExercise[] = planDay.exercises.map((planExercise: any) => ({
      id: `we-${Date.now()}-${Math.random()}`,
      workout_id: '',
      exercise_id: planExercise.exercise_id,
      exercise: planExercise.exercise,
      order: planExercise.order,
      notes: planExercise.notes,
      target_sets: planExercise.target_sets,
      target_reps: planExercise.target_reps,
      target_weight: planExercise.target_weight,
      target_rpe: planExercise.target_rpe,
      sets: []
    }))

    setWorkout(prev => ({
      ...prev,
      exercises: workoutExercises
    }))
  }

  const addExercise = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const newWorkoutExercise: WorkoutExercise = {
      id: `we-${Date.now()}-${Math.random()}`,
      workout_id: '',
      exercise_id: exerciseId,
      exercise,
      order: workout.exercises?.length ? workout.exercises.length + 1 : 1,
      sets: [],
      target_sets: 3,
      target_reps: '8-12'
    }

    setWorkout(prev => ({
      ...prev,
      exercises: [...(prev.exercises || []), newWorkoutExercise]
    }))
    setShowExerciseSelector(false)
  }

  const addSet = (exerciseId: string) => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${Math.random()}`,
      exercise_id: exerciseId,
      set_number: (workout.exercises?.find(we => we.id === exerciseId)?.sets?.length || 0) + 1,
      completed: false
    }

    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map(we =>
        we.id === exerciseId
          ? { ...we, sets: [...(we.sets || []), newSet] }
          : we
      )
    }))
  }

  const updateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map(we =>
        we.id === exerciseId
          ? {
              ...we,
              sets: we.sets?.map(set =>
                set.id === setId ? { ...set, ...updates } : set
              )
            }
          : we
      )
    }))
  }

  const removeSet = (exerciseId: string, setId: string) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises?.map(we =>
        we.id === exerciseId
          ? { ...we, sets: we.sets?.filter(set => set.id !== setId) }
          : we
      )
    }))
  }

  const calculateVolume = (sets: ExerciseSet[]) => {
    return sets
      .filter(set => set.completed && set.reps && set.weight_kg)
      .reduce((total, set) => total + (set.reps! * set.weight_kg!), 0)
  }

  const handleSave = async () => {
    if (!workout.name || !workout.exercises?.length) {
      alert('Please add a workout name and at least one exercise')
      return
    }

    setLoading(true)
    try {
      // Calculate totals
      const totalVolume = workout.exercises?.reduce((total, we) => total + calculateVolume(we.sets || []), 0) || 0
      const allSets = workout.exercises?.flatMap(we => we.sets || []) || []
      const completedSets = allSets.filter(set => set.completed)
      const averageRpe = completedSets.length > 0
        ? completedSets.reduce((sum, set) => sum + (set.rpe || 0), 0) / completedSets.length
        : undefined

      const workoutData = {
        ...workout,
        total_volume: totalVolume,
        average_rpe: averageRpe
      }

      let savedWorkout: StrengthWorkout | null = null

      if (workout.id) {
        // Update existing workout
        savedWorkout = await updateStrengthWorkout(workout.id, workoutData)
      } else {
        // Create new workout
        savedWorkout = await createStrengthWorkout(workoutData as Omit<StrengthWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
      }

      if (savedWorkout && onSave) {
        onSave(savedWorkout)
      }
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Workout Tracker</h2>
        <div className="flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Workout'}
          </button>
        </div>
      </div>

      {/* Workout Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Workout Name</label>
          <input
            type="text"
            value={workout.name}
            onChange={(e) => setWorkout(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={workout.workout_date}
            onChange={(e) => setWorkout(prev => ({ ...prev, workout_date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Completed</label>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={workout.completed}
              onChange={(e) => setWorkout(prev => ({ ...prev, completed: e.target.checked }))}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Mark as completed</span>
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Exercises</h3>
          <button
            onClick={() => setShowExerciseSelector(!showExerciseSelector)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            ➕ Add Exercise
          </button>
        </div>

        {/* Exercise Selector */}
        {showExerciseSelector && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-800">Select Exercise</h4>
              <button
                onClick={() => setShowExerciseSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {exercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => addExercise(exercise.id)}
                  className="text-left p-3 bg-white border border-gray-200 rounded hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="font-medium text-gray-800">{exercise.name}</div>
                  <div className="text-sm text-gray-600">{exercise.category.replace('_', ' ')}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Exercise List */}
        {workout.exercises?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🏋️</div>
            <p>No exercises added yet. Click "Add Exercise" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workout.exercises?.map((workoutExercise, exerciseIndex) => (
              <div key={workoutExercise.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {exerciseIndex + 1}. {workoutExercise.exercise?.name}
                    </h4>
                    <div className="text-sm text-gray-600">
                      Target: {workoutExercise.target_sets} sets × {workoutExercise.target_reps} reps
                      {workoutExercise.target_weight && ` @ ${workoutExercise.target_weight}`}
                    </div>
                  </div>
                  <button
                    onClick={() => addSet(workoutExercise.id)}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Add Set
                  </button>
                </div>

                {/* Sets */}
                {workoutExercise.sets?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No sets recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-2 text-sm font-medium text-gray-700 mb-2">
                      <div>Set</div>
                      <div>Reps</div>
                      <div>Weight (kg)</div>
                      <div>Weight (lbs)</div>
                      <div>RPE</div>
                      <div>Rest (s)</div>
                      <div>Actions</div>
                    </div>
                    {workoutExercise.sets?.map((set, setIndex) => (
                      <div key={set.id} className="grid grid-cols-7 gap-2 items-center">
                        <div className="text-sm font-medium">{set.set_number}</div>
                        <input
                          type="number"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(workoutExercise.id, set.id, { reps: parseInt(e.target.value) || undefined })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          placeholder="0"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight_kg || ''}
                          onChange={(e) => updateSet(workoutExercise.id, set.id, { weight_kg: parseFloat(e.target.value) || undefined })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          placeholder="0"
                        />
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight_lbs || ''}
                          onChange={(e) => updateSet(workoutExercise.id, set.id, { weight_lbs: parseFloat(e.target.value) || undefined })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          placeholder="0"
                        />
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={set.rpe || ''}
                          onChange={(e) => updateSet(workoutExercise.id, set.id, { rpe: parseInt(e.target.value) || undefined })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          placeholder="1-10"
                        />
                        <input
                          type="number"
                          value={set.rest_time_seconds || ''}
                          onChange={(e) => updateSet(workoutExercise.id, set.id, { rest_time_seconds: parseInt(e.target.value) || undefined })}
                          className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          placeholder="0"
                        />
                        <div className="flex gap-1">
                          <input
                            type="checkbox"
                            checked={set.completed}
                            onChange={(e) => updateSet(workoutExercise.id, set.id, { completed: e.target.checked })}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <button
                            onClick={() => removeSet(workoutExercise.id, set.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Volume Summary */}
                {workoutExercise.sets?.some(set => set.completed) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Volume: <span className="font-medium">{calculateVolume(workoutExercise.sets || [])} kg</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workout Summary */}
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">Workout Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Exercises</div>
              <div className="font-semibold text-lg">{workout.exercises.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Total Sets</div>
              <div className="font-semibold text-lg">
                {workout.exercises.reduce((total, we) => total + (we.sets?.length || 0), 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Completed Sets</div>
              <div className="font-semibold text-lg">
                {workout.exercises.reduce((total, we) =>
                  total + (we.sets?.filter(set => set.completed).length || 0), 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Total Volume</div>
              <div className="font-semibold text-lg">
                {workout.exercises.reduce((total, we) => total + calculateVolume(we.sets || []), 0)} kg
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
