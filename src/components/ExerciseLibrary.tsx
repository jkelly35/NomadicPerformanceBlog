'use client'

import { useState, useEffect } from 'react'
import { Exercise, getExercises } from '@/lib/fitness-data'

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void
  multiSelect?: boolean
  selectedExercises?: Exercise[]
  compact?: boolean
  showFilters?: boolean
}

export default function ExerciseLibrary({
  onSelectExercise,
  multiSelect = false,
  selectedExercises = [],
  compact = false,
  showFilters = true
}: ExerciseLibraryProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([])

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchTerm, selectedCategory, selectedDifficulty, selectedMuscleGroups])

  const loadExercises = async () => {
    setLoading(true)
    try {
      const data = await getExercises()
      setExercises(data)
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscle_groups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory)
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(exercise => exercise.difficulty === selectedDifficulty)
    }

    // Muscle groups filter
    if (selectedMuscleGroups.length > 0) {
      filtered = filtered.filter(exercise =>
        selectedMuscleGroups.some(mg => exercise.muscle_groups.includes(mg))
      )
    }

    setFilteredExercises(filtered)
  }

  const toggleMuscleGroup = (muscleGroup: string) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(muscleGroup)
        ? prev.filter(mg => mg !== muscleGroup)
        : [...prev, muscleGroup]
    )
  }

  const isSelected = (exercise: Exercise) => {
    return selectedExercises.some(se => se.id === exercise.id)
  }

  const handleExerciseClick = (exercise: Exercise) => {
    if (onSelectExercise) {
      onSelectExercise(exercise)
    }
  }

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'upper_body', label: 'Upper Body' },
    { value: 'lower_body', label: 'Lower Body' },
    { value: 'full_body', label: 'Full Body' },
    { value: 'core', label: 'Core' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'olympic', label: 'Olympic' },
    { value: 'powerlifting', label: 'Powerlifting' },
    { value: 'bodybuilding', label: 'Bodybuilding' },
    { value: 'functional', label: 'Functional' }
  ]

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ]

  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Obliques'
  ]

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🏋️</div>
          <h3 className="text-xl font-bold text-gray-800">Exercise Library</h3>
        </div>
        <div className="text-sm text-gray-600">
          {filteredExercises.length} exercises
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Category and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>

          {/* Muscle Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Muscle Groups</label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map(muscle => (
                <button
                  key={muscle}
                  onClick={() => toggleMuscleGroup(muscle)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedMuscleGroups.includes(muscle)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-orange-300'
                  }`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No exercises found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          compact
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => handleExerciseClick(exercise)}
              className={`border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer ${
                isSelected(exercise) ? 'ring-2 ring-orange-500 bg-orange-50' : ''
              } ${compact ? 'p-3' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className={`font-semibold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>
                  {exercise.name}
                </h4>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {exercise.difficulty}
                </span>
              </div>

              <div className={`text-gray-600 mb-2 ${compact ? 'text-xs' : 'text-sm'}`}>
                {exercise.category.replace('_', ' ')} • {exercise.muscle_groups.join(', ')}
              </div>

              <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                Equipment: {exercise.equipment.length > 0 ? exercise.equipment.join(', ') : 'Bodyweight'}
              </div>

              {exercise.instructions && !compact && (
                <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                  {exercise.instructions}
                </div>
              )}

              {multiSelect && isSelected(exercise) && (
                <div className="mt-2 flex items-center text-orange-600 text-sm">
                  <span className="mr-1">✓</span>
                  Selected
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
