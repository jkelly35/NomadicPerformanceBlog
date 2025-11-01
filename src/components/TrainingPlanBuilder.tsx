'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TrainingPlan, TrainingPhase, TrainingWeek, TrainingDay, Exercise, createTrainingPlan, getExercises } from '@/lib/fitness-data'

type TrainingBlockType = 'warm-up' | 'power' | 'strength' | 'conditioning' | 'mobility' | 'recovery'

interface TrainingBlock {
  id: string
  type: TrainingBlockType
  name: string
  exercises: TrainingExercise[]
}

interface TrainingExercise {
  id: string
  exercise_id: string
  exercise?: Exercise
  order: number
  sets: number
  reps: string
  tempo?: string // e.g., "3-1-2-0" (eccentric-isometric-concentric-pause)
  rest_seconds: number
  load?: string // e.g., "70% 1RM", "RPE 7", "50kg"
  rpe?: number
  notes?: string
  video_url?: string
}

interface TrainingPlanBuilderProps {
  onSave?: (plan: TrainingPlan) => void
  onCancel?: () => void
  initialPlan?: Partial<TrainingPlan>
}

interface MissionConstraints {
  sport: string
  primary_demands: ('max_strength' | 'power' | 'endurance' | 'agility' | 'mixed')[]
  time_horizon: 'off_season' | 'pre_season' | 'in_season' | 'competition_prep'
  total_weeks: number
  sessions_per_week: number
  training_schedule: string
  equipment_available: ('barbell' | 'dumbbells' | 'kettlebells' | 'cables' | 'bodyweight' | 'field_only')[]
  training_age: 'beginner' | 'intermediate' | 'advanced'
  injury_history: string
  movement_limits: string
  kpis: string[]
  baseline_assessments: {
    strength_tests: string[]
    power_tests: string[]
    capacity_tests: string[]
    readiness_inputs: boolean
  }
}

export default function TrainingPlanBuilder({ onSave, onCancel, initialPlan }: TrainingPlanBuilderProps) {
  const [wizardStep, setWizardStep] = useState<'mission' | 'periodization' | 'structure' | 'training_days' | 'training_blocks' | 'movements' | 'progression' | 'complete'>('mission')
  const [missionConstraints, setMissionConstraints] = useState<MissionConstraints>({
    sport: '',
    primary_demands: [],
    time_horizon: 'off_season',
    total_weeks: 12,
    sessions_per_week: 4,
    training_schedule: '',
    equipment_available: ['barbell', 'dumbbells'],
    training_age: 'intermediate',
    injury_history: '',
    movement_limits: '',
    kpis: [],
    baseline_assessments: {
      strength_tests: [],
      power_tests: [],
      capacity_tests: [],
      readiness_inputs: false
    }
  })

  const [periodizationModel, setPeriodizationModel] = useState<'linear' | 'undulating' | 'block'>('linear')
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState<number>(4)
  const [plan, setPlan] = useState<Partial<TrainingPlan>>({
    name: '',
    description: '',
    category: 'strength',
    difficulty: 'intermediate',
    duration_weeks: 4,
    tags: [],
    phases: [],
    ...initialPlan
  })

  const [currentPhase, setCurrentPhase] = useState<Partial<TrainingPhase> | null>(null)
  const [currentWeek, setCurrentWeek] = useState<Partial<TrainingWeek> | null>(null)
  const [currentDay, setCurrentDay] = useState<Partial<TrainingDay> | null>(null)
  const [trainingBlocks, setTrainingBlocks] = useState<TrainingBlock[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'plan' | 'phases' | 'days' | 'blocks' | 'exercises'>('plan')
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'phase'>('day')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    const data = await getExercises()
    setExercises(data)
  }

  // Mission Definition Wizard Component
  const MissionWizard = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Define Your Training Mission</h2>
        <p className="text-gray-600">Set the foundation for your periodized training plan by defining constraints and goals first.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
        {/* Sport & Primary Demands */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">1. Sport & Primary Demands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport/Role</label>
              <input
                type="text"
                placeholder="e.g., Powerlifting, Football, General Fitness"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={missionConstraints.sport}
                onChange={(e) => setMissionConstraints(prev => ({ ...prev, sport: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Demands</label>
              <div className="space-y-2">
                {[
                  { value: 'max_strength', label: 'Max Strength' },
                  { value: 'power', label: 'Power/Explosiveness' },
                  { value: 'endurance', label: 'Endurance/Capacity' },
                  { value: 'agility', label: 'Agility/Speed' },
                  { value: 'mixed', label: 'Mixed Demands' }
                ].map(demand => (
                  <label key={demand.value} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={missionConstraints.primary_demands.includes(demand.value as any)}
                      onChange={(e) => {
                        const value = demand.value as any
                        setMissionConstraints(prev => ({
                          ...prev,
                          primary_demands: e.target.checked
                            ? [...prev.primary_demands, value]
                            : prev.primary_demands.filter(d => d !== value)
                        }))
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">{demand.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Time Horizon & Schedule */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">2. Time Horizon & Schedule</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={missionConstraints.time_horizon}
                onChange={(e) => setMissionConstraints(prev => ({ ...prev, time_horizon: e.target.value as any }))}
              >
                <option value="off_season">Off Season</option>
                <option value="pre_season">Pre Season</option>
                <option value="in_season">In Season</option>
                <option value="competition_prep">Competition Prep</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Weeks</label>
              <input
                type="number"
                min="4"
                max="52"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={missionConstraints.total_weeks}
                onChange={(e) => setMissionConstraints(prev => ({ ...prev, total_weeks: parseInt(e.target.value) || 12 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sessions per Week</label>
              <input
                type="number"
                min="2"
                max="7"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={missionConstraints.sessions_per_week}
                onChange={(e) => setMissionConstraints(prev => ({ ...prev, sessions_per_week: parseInt(e.target.value) || 4 }))}
              />
            </div>
          </div>
        </div>

        {/* Equipment & Experience */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">3. Equipment & Experience</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Equipment</label>
              <div className="space-y-2">
                {[
                  { value: 'barbell', label: 'Barbell' },
                  { value: 'dumbbells', label: 'Dumbbells' },
                  { value: 'kettlebells', label: 'Kettlebells' },
                  { value: 'cables', label: 'Cables/Machines' },
                  { value: 'bodyweight', label: 'Bodyweight Only' },
                  { value: 'field_only', label: 'Field/Sport Specific' }
                ].map(equipment => (
                  <label key={equipment.value} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={missionConstraints.equipment_available.includes(equipment.value as any)}
                      onChange={(e) => {
                        const value = equipment.value as any
                        setMissionConstraints(prev => ({
                          ...prev,
                          equipment_available: e.target.checked
                            ? [...prev.equipment_available, value]
                            : prev.equipment_available.filter(eq => eq !== value)
                        }))
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">{equipment.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Training Age</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={missionConstraints.training_age}
                onChange={(e) => setMissionConstraints(prev => ({ ...prev, training_age: e.target.value as any }))}
              >
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3+ years)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setWizardStep('periodization')}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
        >
          Next: Choose Periodization →
        </button>
      </div>
    </div>
  )

  // Periodization Model Selection Wizard Component
  const PeriodizationWizard = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Select Periodization Model</h2>
        <p className="text-gray-600">Choose how your training will progress over the {missionConstraints.total_weeks} weeks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            id: 'linear',
            name: 'Linear Periodization',
            description: 'Progressive overload with decreasing volume and increasing intensity',
            bestFor: 'Strength building, beginners to intermediate',
            phases: 'Hypertrophy → Strength → Power'
          },
          {
            id: 'undulating',
            name: 'Undulating Periodization',
            description: 'Varied intensity and volume within each week',
            bestFor: 'Maintaining motivation, intermediate to advanced',
            phases: 'Mixed focus with weekly variations'
          },
          {
            id: 'block',
            name: 'Block Periodization',
            description: 'Concentrated blocks of similar training followed by transitions',
            bestFor: 'Peak performance, advanced athletes',
            phases: 'Accumulation → Transmutation → Realization'
          }
        ].map(model => (
          <div
            key={model.id}
            onClick={() => setPeriodizationModel(model.id as any)}
            className={`bg-white rounded-xl shadow-lg border-2 p-6 cursor-pointer transition-all ${
              periodizationModel === model.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-3">{model.name}</h3>
            <p className="text-gray-600 mb-4">{model.description}</p>
            <div className="space-y-2">
              <div className="text-sm">
                <strong className="text-gray-700">Best for:</strong> {model.bestFor}
              </div>
              <div className="text-sm">
                <strong className="text-gray-700">Phases:</strong> {model.phases}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setWizardStep('mission')}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Mission
        </button>
        <button
          onClick={() => setWizardStep('structure')}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
        >
          Next: Plan Structure →
        </button>
      </div>
    </div>
  )

  // Placeholder components for other wizard steps
  const StructureWizard = () => {
    const [structure, setStructure] = useState({
      phases: [] as Array<{
        name: string
        duration_weeks: number
        focus: 'hypertrophy' | 'strength' | 'power' | 'peaking'
        goal: string
      }>
    })

    // Generate recommended structure based on periodization model and constraints
    useEffect(() => {
      const generateStructure = () => {
        const totalWeeks = missionConstraints.total_weeks
        const sessionsPerWeek = missionConstraints.sessions_per_week

        let phases: Array<{
          name: string
          duration_weeks: number
          focus: 'hypertrophy' | 'strength' | 'power' | 'peaking'
          goal: string
        }> = []

        if (periodizationModel === 'linear') {
          // Linear: Hypertrophy → Strength → Power progression
          if (totalWeeks >= 12) {
            phases = [
              {
                name: 'Hypertrophy & Work Capacity',
                duration_weeks: Math.floor(totalWeeks * 0.4),
                focus: 'hypertrophy' as const,
                goal: 'Build muscle mass and work capacity'
              },
              {
                name: 'Max Strength Development',
                duration_weeks: Math.floor(totalWeeks * 0.4),
                focus: 'strength' as const,
                goal: 'Increase maximal strength levels'
              },
              {
                name: 'Power & Peaking',
                duration_weeks: totalWeeks - Math.floor(totalWeeks * 0.8),
                focus: 'power' as const,
                goal: 'Convert strength to power and peak performance'
              }
            ]
          } else {
            // Shorter plan: Combined phases
            phases = [
              {
                name: 'Strength & Power Development',
                duration_weeks: totalWeeks,
                focus: 'strength' as const,
                goal: 'Build overall strength and power'
              }
            ]
          }
        } else if (periodizationModel === 'undulating') {
          // Undulating: Rotate focuses within weeks
          phases = [
            {
              name: 'Undulating Strength Development',
              duration_weeks: totalWeeks,
              focus: 'strength' as const,
              goal: 'Progressive overload with varied rep ranges'
            }
          ]
        } else if (periodizationModel === 'block') {
          // Block: Accumulation → Transmutation → Realization
          if (totalWeeks >= 9) {
            const blockSize = Math.floor(totalWeeks / 3)
            phases = [
              {
                name: 'Accumulation Block',
                duration_weeks: blockSize,
                focus: 'hypertrophy' as const,
                goal: 'Build work capacity and technique'
              },
              {
                name: 'Transmutation Block',
                duration_weeks: blockSize,
                focus: 'strength' as const,
                goal: 'Convert volume to strength gains'
              },
              {
                name: 'Realization Block',
                duration_weeks: totalWeeks - (blockSize * 2),
                focus: 'power' as const,
                goal: 'Peak performance and competition prep'
              }
            ]
          } else {
            phases = [
              {
                name: 'Block Periodization',
                duration_weeks: totalWeeks,
                focus: 'strength' as const,
                goal: 'Progressive block training'
              }
            ]
          }
        }

        setStructure({ phases })
      }

      generateStructure()
    }, [periodizationModel, missionConstraints])

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Plan Structure</h2>
          <p className="text-gray-600">Setting up your {missionConstraints.total_weeks}-week training plan structure</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Recommended Structure</h3>

          <div className="space-y-4">
            {structure.phases.map((phase, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Phase {index + 1}: {phase.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{phase.goal}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-700">{phase.duration_weeks} weeks</div>
                    <div className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                      phase.focus === 'hypertrophy' ? 'bg-blue-100 text-blue-800' :
                      phase.focus === 'strength' ? 'bg-red-100 text-red-800' :
                      phase.focus === 'power' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {phase.focus.charAt(0).toUpperCase() + phase.focus.slice(1)} Focus
                    </div>
                  </div>
                </div>

                {/* Phase details based on focus */}
                <div className="bg-gray-50 rounded p-3">
                  {phase.focus === 'hypertrophy' && (
                    <div className="text-sm text-gray-700">
                      <strong>Training Focus:</strong> 6-12 reps @ 60-75% 1RM, 3-6 sets, higher volume
                      <br />
                      <strong>Goal:</strong> Muscle growth and work capacity development
                    </div>
                  )}
                  {phase.focus === 'strength' && (
                    <div className="text-sm text-gray-700">
                      <strong>Training Focus:</strong> 3-6 reps @ 75-90% 1RM, 3-6 sets, progressive overload
                      <br />
                      <strong>Goal:</strong> Maximum strength development
                    </div>
                  )}
                  {phase.focus === 'power' && (
                    <div className="text-sm text-gray-700">
                      <strong>Training Focus:</strong> 2-5 reps @ 30-60% 1RM with velocity, explosive movements
                      <br />
                      <strong>Goal:</strong> Power output and performance peaking
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Training Frequency</h4>
            <p className="text-sm text-blue-700">
              Based on your {missionConstraints.sessions_per_week} sessions per week, each phase will include:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Primary strength/power days</li>
              <li>• Assistance/accessory work</li>
              <li>• Recovery and mobility sessions</li>
              {missionConstraints.primary_demands.includes('endurance') && <li>• Conditioning work</li>}
            </ul>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setWizardStep('periodization')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Periodization
          </button>
          <button
            onClick={() => setWizardStep('training_days')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Next: Training Days →
          </button>
        </div>
      </div>
    )
  }

  // Training Days Selection Wizard Component
  const TrainingDaysWizard = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Training Days per Week</h2>
        <p className="text-gray-600">Select how many training days you want per week for your plan.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Training Days per Week</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[3, 4, 5, 6].map(days => (
              <button
                key={days}
                onClick={() => setTrainingDaysPerWeek(days)}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  trainingDaysPerWeek === days
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl font-bold">{days}</div>
                <div className="text-sm">days/week</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Recommended Schedule</h4>
          <p className="text-sm text-blue-700 mb-2">
            With {trainingDaysPerWeek} training days per week:
          </p>
          <div className="text-sm text-blue-700">
            {trainingDaysPerWeek === 3 && "• Focus on full-body or push/pull/legs split"}
            {trainingDaysPerWeek === 4 && "• Upper/Lower split or push/pull/legs + full body"}
            {trainingDaysPerWeek === 5 && "• 5-day split with optional rest or light day"}
            {trainingDaysPerWeek === 6 && "• 6-day program with one lighter recovery day"}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setWizardStep('structure')}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Structure
        </button>
        <button
          onClick={() => setWizardStep('training_blocks')}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
        >
          Next: Create Training Blocks →
        </button>
      </div>
    </div>
  )

  // Training Blocks Creation Wizard Component
  const TrainingBlocksWizard = () => {
    const [selectedWeek, setSelectedWeek] = useState(1)
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [trainingPlan, setTrainingPlan] = useState<TrainingPlan>({
      id: `plan_${Date.now()}`,
      name: '',
      description: '',
      category: 'strength',
      difficulty: 'intermediate',
      duration_weeks: missionConstraints.total_weeks,
      phases: [],
      is_public: false,
      created_by: 'user',
      tags: [],
      created_at: new Date().toISOString()
    })

    // Initialize training plan structure
    useEffect(() => {
      const initializePlan = () => {
        const weeks: TrainingWeek[] = []
        for (let weekNum = 1; weekNum <= missionConstraints.total_weeks; weekNum++) {
          const days: TrainingDay[] = []
          for (let dayNum = 1; dayNum <= trainingDaysPerWeek; dayNum++) {
            days.push({
              id: `day_${weekNum}_${dayNum}`,
              week_id: `week_${weekNum}`,
              day_number: dayNum,
              name: `Day ${dayNum}`,
              focus: ['strength'],
              exercises: [],
              estimated_duration: 60,
              notes: ''
            })
          }
          weeks.push({
            id: `week_${weekNum}`,
            phase_id: 'phase_1',
            week_number: weekNum,
            name: `Week ${weekNum}`,
            focus: 'strength',
            days: days,
            notes: ''
          })
        }

        setTrainingPlan(prev => ({
          ...prev,
          phases: [{
            id: 'phase_1',
            plan_id: prev.id,
            phase_number: 1,
            name: 'Main Training Phase',
            description: 'Primary training phase',
            duration_weeks: missionConstraints.total_weeks,
            goal: 'Build strength and muscle mass',
            weeks: weeks,
            notes: ''
          }]
        }))
      }

      initializePlan()
    }, [missionConstraints.total_weeks, trainingDaysPerWeek])

    const copyDay = (sourceWeek: number, sourceDay: number, targetWeek: number) => {
      const sourceDayData = trainingPlan.phases[0]?.weeks[sourceWeek - 1]?.days[sourceDay - 1]
      if (!sourceDayData) return

      setTrainingPlan(prev => {
        const newPlan = { ...prev }
        const targetDay = newPlan.phases[0].weeks[targetWeek - 1].days[sourceDay - 1]
        if (targetDay) {
          targetDay.exercises = JSON.parse(JSON.stringify(sourceDayData.exercises)) // Deep copy
        }
        return newPlan
      })
    }

    const copyWeek = (sourceWeek: number, targetWeek: number) => {
      const sourceWeekData = trainingPlan.phases[0]?.weeks[sourceWeek - 1]
      if (!sourceWeekData) return

      setTrainingPlan(prev => {
        const newPlan = { ...prev }
        const targetWeekData = newPlan.phases[0].weeks[targetWeek - 1]
        if (targetWeekData) {
          targetWeekData.days = JSON.parse(JSON.stringify(sourceWeekData.days)) // Deep copy all days
        }
        return newPlan
      })
    }

    const addExerciseToDay = (weekNum: number, dayNum: number, exerciseId: string) => {
      const exercise = exercises.find(e => e.id === exerciseId)
      if (!exercise) return

      setTrainingPlan(prev => {
        const newPlan = { ...prev }
        const day = newPlan.phases[0].weeks[weekNum - 1].days[dayNum - 1]
        if (day) {
          const newExercise = {
            exercise_id: exercise.id,
            exercise: exercise,
            order: day.exercises.length + 1,
            target_sets: 3,
            target_reps: '8-12',
            target_weight: '70% 1RM',
            target_rpe: 7,
            rest_time_seconds: 120,
            notes: ''
          }
          day.exercises.push(newExercise)
        }
        return newPlan
      })
    }

    const removeExerciseFromDay = (weekNum: number, dayNum: number, exerciseId: string) => {
      setTrainingPlan(prev => {
        const newPlan = { ...prev }
        const day = newPlan.phases[0].weeks[weekNum - 1].days[dayNum - 1]
        if (day) {
          day.exercises = day.exercises.filter(ex => ex.exercise_id !== exerciseId)
        }
        return newPlan
      })
    }

    const currentWeek = trainingPlan.phases[0]?.weeks[selectedWeek - 1]

    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Create Training Blocks</h2>
          <p className="text-gray-600">Build your training plan by adding exercises to each training day.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Week Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Training Weeks</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Array.from({ length: missionConstraints.total_weeks }, (_, i) => i + 1).map(weekNum => (
                  <button
                    key={weekNum}
                    onClick={() => setSelectedWeek(weekNum)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedWeek === weekNum
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">Week {weekNum}</div>
                    <div className="text-sm text-gray-500">
                      {trainingPlan.phases[0]?.weeks[weekNum - 1]?.days.length || 0} days
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Week View */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Week {selectedWeek}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (selectedWeek > 1) {
                        copyWeek(selectedWeek - 1, selectedWeek)
                      }
                    }}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    disabled={selectedWeek === 1}
                  >
                    Copy from Week {selectedWeek - 1}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {currentWeek?.days.map((day, dayIndex) => (
                  <div
                    key={day.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDay === dayIndex + 1
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDay(selectedDay === dayIndex + 1 ? null : dayIndex + 1)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">{day.name}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (dayIndex > 0) {
                              copyDay(selectedWeek, dayIndex, selectedWeek)
                            }
                          }}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                          disabled={dayIndex === 0}
                        >
                          Copy Prev
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {day.exercises.length > 0 ? (
                        day.exercises.map((exercise, exerciseIndex) => (
                          <div key={`${exercise.exercise_id}_${exerciseIndex}`} className="text-sm bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-800">
                              {exercise.exercise?.name || 'Unknown Exercise'}
                            </div>
                            <div className="text-gray-600">
                              {exercise.target_sets} × {exercise.target_reps} @ {exercise.target_weight}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm italic">No exercises added</div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                      {day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Detail View */}
            {selectedDay && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Week {selectedWeek} - Day {selectedDay}
                  </h3>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add Exercise</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      onChange={(e) => {
                        if (e.target.value) {
                          addExerciseToDay(selectedWeek, selectedDay, e.target.value)
                          e.target.value = ''
                        }
                      }}
                    >
                      <option value="">Select an exercise...</option>
                      {exercises
                        .filter(exercise =>
                          exercise.equipment.length === 0 ||
                          exercise.equipment.some(eq => missionConstraints.equipment_available.includes(eq as any))
                        )
                        .map(exercise => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.name} ({exercise.equipment.join(', ')})
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="space-y-3">
                    {currentWeek?.days[selectedDay - 1]?.exercises.map((exercise, exerciseIndex) => (
                      <div key={`${exercise.exercise_id}_${exerciseIndex}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">
                            {exercise.exercise?.name || 'Unknown Exercise'}
                          </h4>
                          <button
                            onClick={() => removeExerciseFromDay(selectedWeek, selectedDay, exercise.exercise_id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Sets</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={exercise.target_sets}
                              onChange={(e) => {
                                setTrainingPlan(prev => {
                                  const newPlan = { ...prev }
                                  const day = newPlan.phases[0].weeks[selectedWeek - 1].days[selectedDay - 1]
                                  if (day && day.exercises[exerciseIndex]) {
                                    day.exercises[exerciseIndex].target_sets = parseInt(e.target.value) || 1
                                  }
                                  return newPlan
                                })
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Reps</label>
                            <input
                              type="text"
                              value={exercise.target_reps}
                              onChange={(e) => {
                                setTrainingPlan(prev => {
                                  const newPlan = { ...prev }
                                  const day = newPlan.phases[0].weeks[selectedWeek - 1].days[selectedDay - 1]
                                  if (day && day.exercises[exerciseIndex]) {
                                    day.exercises[exerciseIndex].target_reps = e.target.value
                                  }
                                  return newPlan
                                })
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Weight</label>
                            <input
                              type="text"
                              value={exercise.target_weight || ''}
                              onChange={(e) => {
                                setTrainingPlan(prev => {
                                  const newPlan = { ...prev }
                                  const day = newPlan.phases[0].weeks[selectedWeek - 1].days[selectedDay - 1]
                                  if (day && day.exercises[exerciseIndex]) {
                                    day.exercises[exerciseIndex].target_weight = e.target.value
                                  }
                                  return newPlan
                                })
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">RPE</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={exercise.target_rpe || ''}
                              onChange={(e) => {
                                setTrainingPlan(prev => {
                                  const newPlan = { ...prev }
                                  const day = newPlan.phases[0].weeks[selectedWeek - 1].days[selectedDay - 1]
                                  if (day && day.exercises[exerciseIndex]) {
                                    day.exercises[exerciseIndex].target_rpe = parseInt(e.target.value) || undefined
                                  }
                                  return newPlan
                                })
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setWizardStep('training_days')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Training Days
          </button>
          <button
            onClick={() => setWizardStep('movements')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Next: Select Movements →
          </button>
        </div>
      </div>
    )
  }

  const MovementsWizard = () => {
    const [selectedMovements, setSelectedMovements] = useState({
      primary: [] as string[],
      power: [] as string[],
      assistance: [] as string[],
      accessory: [] as string[],
      conditioning: [] as string[]
    })

    // Filter exercises based on available equipment
    const availableExercises = exercises.filter(exercise => {
      if (missionConstraints.equipment_available.includes('bodyweight') && exercise.equipment.length === 0) {
        return true
      }
      return exercise.equipment.some(eq => missionConstraints.equipment_available.includes(eq as any))
    })

    const movementCategories = {
      primary: {
        title: 'Primary Movements',
        description: 'Main compound lifts that drive your primary goals',
        examples: availableExercises.filter(e =>
          ['squat', 'deadlift', 'bench press', 'overhead press', 'row'].some(term =>
            e.name.toLowerCase().includes(term)
          )
        ).slice(0, 5)
      },
      power: {
        title: 'Power & Explosive',
        description: 'Olympic lifts and plyometric movements',
        examples: availableExercises.filter(e =>
          ['snatch', 'clean', 'jerk', 'box jump', 'medicine ball'].some(term =>
            e.name.toLowerCase().includes(term)
          )
        ).slice(0, 5)
      },
      assistance: {
        title: 'Assistance Exercises',
        description: 'Support movements that complement primary lifts',
        examples: availableExercises.filter(e =>
          ['pull-up', 'dip', 'lunge', 'step-up', 'face pull'].some(term =>
            e.name.toLowerCase().includes(term)
          )
        ).slice(0, 5)
      },
      accessory: {
        title: 'Accessory Work',
        description: 'Isolation and accessory movements',
        examples: availableExercises.filter(e =>
          ['curl', 'extension', 'raise', 'fly', 'shrug'].some(term =>
            e.name.toLowerCase().includes(term)
          )
        ).slice(0, 5)
      },
      conditioning: {
        title: 'Conditioning & Recovery',
        description: 'Cardio, mobility, and recovery work',
        examples: availableExercises.filter(e =>
          ['run', 'bike', 'row', 'stretch', 'foam roll'].some(term =>
            e.name.toLowerCase().includes(term)
          )
        ).slice(0, 5)
      }
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Select Movements</h2>
          <p className="text-gray-600">Choose exercises for each category based on your equipment and goals.</p>
        </div>

        <div className="space-y-6">
          {Object.entries(movementCategories).map(([category, config]) => (
            <div key={category} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{config.title}</h3>
                  <p className="text-gray-600 mt-1">{config.description}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedMovements[category as keyof typeof selectedMovements].length} selected
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {config.examples.map(exercise => (
                  <label key={exercise.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      checked={selectedMovements[category as keyof typeof selectedMovements].includes(exercise.id)}
                      onChange={(e) => {
                        const categoryKey = category as keyof typeof selectedMovements
                        setSelectedMovements(prev => ({
                          ...prev,
                          [categoryKey]: e.target.checked
                            ? [...prev[categoryKey], exercise.id]
                            : prev[categoryKey].filter(id => id !== exercise.id)
                        }))
                      }}
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-800">{exercise.name}</div>
                      <div className="text-sm text-gray-500">{exercise.equipment.join(', ')}</div>
                    </div>
                  </label>
                ))}
              </div>

              {config.examples.length === 0 && (
                <p className="text-gray-500 text-center py-4">No exercises available for this category with your equipment.</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Selection Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {Object.entries(selectedMovements).map(([category, ids]) => (
              <div key={category} className="text-center">
                <div className="font-medium text-blue-700 capitalize">{category}</div>
                <div className="text-blue-600">{ids.length} exercises</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-blue-700">
            <strong>Recommendations:</strong> Aim for 2-4 primary movements, 1-2 power exercises, 3-6 assistance movements, 2-4 accessory exercises, and 1-2 conditioning activities.
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setWizardStep('training_blocks')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Training Blocks
          </button>
          <button
            onClick={() => setWizardStep('progression')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Next: Progression & Dosing →
          </button>
        </div>
      </div>
    )
  }

  const ProgressionWizard = () => {
    const [progressionSettings, setProgressionSettings] = useState({
      setsRepsScheme: {
        hypertrophy: { sets: 3, reps: '8-12', rpe: 7 },
        strength: { sets: 4, reps: '3-6', rpe: 8 },
        power: { sets: 3, reps: '2-5', rpe: 9 }
      },
      progressionType: 'linear' as 'linear' | 'step' | 'wave',
      deloadFrequency: 'every_4_weeks' as 'every_4_weeks' | 'every_6_weeks' | 'every_8_weeks' | 'manual',
      intensityMethod: 'percentage' as 'percentage' | 'rpe' | 'rir',
      volumeProgression: 'moderate' as 'conservative' | 'moderate' | 'aggressive',
      accessoryVolume: 'moderate' as 'low' | 'moderate' | 'high'
    })

    const getRecommendedProgression = () => {
      const recommendations = {
        linear: {
          name: 'Linear Progression',
          description: 'Steady increases in weight/reps every 1-2 weeks',
          bestFor: 'Beginners, steady progress',
          example: 'Week 1: 3x8 @ 70%, Week 2: 3x8 @ 72.5%, Week 3: 3x8 @ 75%'
        },
        step: {
          name: 'Step Loading',
          description: 'Period of steady training followed by step increases',
          bestFor: 'Intermediate lifters, plateaus',
          example: 'Weeks 1-3: 3x8 @ 70%, Week 4: 3x6 @ 75%, Week 5: 3x5 @ 77.5%'
        },
        wave: {
          name: 'Wave Loading',
          description: 'Alternating high and low intensity weeks',
          bestFor: 'Advanced lifters, recovery management',
          example: 'Week 1: 3x8 @ 70%, Week 2: 3x6 @ 75%, Week 3: 3x10 @ 65%'
        }
      }

      return recommendations[progressionSettings.progressionType]
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Progression & Dosing</h2>
          <p className="text-gray-600">Configure how your training will progress and intensity will be managed.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Progression Type */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Progression Strategy</h3>
            <div className="space-y-3">
              {[
                { value: 'linear', label: 'Linear Progression', desc: 'Steady weekly increases' },
                { value: 'step', label: 'Step Loading', desc: 'Period stability then jumps' },
                { value: 'wave', label: 'Wave Loading', desc: 'Alternating intensity weeks' }
              ].map(strategy => (
                <label key={strategy.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="progression"
                    value={strategy.value}
                    checked={progressionSettings.progressionType === strategy.value}
                    onChange={(e) => setProgressionSettings(prev => ({
                      ...prev,
                      progressionType: e.target.value as any
                    }))}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-800">{strategy.label}</div>
                    <div className="text-sm text-gray-500">{strategy.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">{getRecommendedProgression().name}</h4>
              <p className="text-sm text-blue-700 mb-2">{getRecommendedProgression().description}</p>
              <p className="text-xs text-blue-600"><strong>Example:</strong> {getRecommendedProgression().example}</p>
            </div>
          </div>

          {/* Intensity Method */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Intensity Tracking</h3>
            <div className="space-y-3">
              {[
                { value: 'percentage', label: 'Percentage Based', desc: '% of 1RM, requires testing' },
                { value: 'rpe', label: 'RPE Scale', desc: 'Rate of Perceived Exertion (1-10)' },
                { value: 'rir', label: 'RIR Method', desc: 'Reps in Reserve estimation' }
              ].map(method => (
                <label key={method.value} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="intensity"
                    value={method.value}
                    checked={progressionSettings.intensityMethod === method.value}
                    onChange={(e) => setProgressionSettings(prev => ({
                      ...prev,
                      intensityMethod: e.target.value as any
                    }))}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-800">{method.label}</div>
                    <div className="text-sm text-gray-500">{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sets & Reps Guidelines */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Sets × Reps × Intensity Guidelines</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                phase: 'Hypertrophy',
                sets: progressionSettings.setsRepsScheme.hypertrophy.sets,
                reps: progressionSettings.setsRepsScheme.hypertrophy.reps,
                rpe: progressionSettings.setsRepsScheme.hypertrophy.rpe,
                color: 'blue'
              },
              {
                phase: 'Strength',
                sets: progressionSettings.setsRepsScheme.strength.sets,
                reps: progressionSettings.setsRepsScheme.strength.reps,
                rpe: progressionSettings.setsRepsScheme.strength.rpe,
                color: 'red'
              },
              {
                phase: 'Power',
                sets: progressionSettings.setsRepsScheme.power.sets,
                reps: progressionSettings.setsRepsScheme.power.reps,
                rpe: progressionSettings.setsRepsScheme.power.rpe,
                color: 'purple'
              }
            ].map(phase => (
              <div key={phase.phase} className={`border-2 border-${phase.color}-200 rounded-lg p-4 bg-${phase.color}-50`}>
                <h4 className={`text-lg font-semibold text-${phase.color}-800 mb-3`}>{phase.phase} Phase</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sets:</span>
                    <span className="font-medium">{phase.sets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Reps:</span>
                    <span className="font-medium">{phase.reps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">RPE Target:</span>
                    <span className="font-medium">{phase.rpe}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery & Deload Settings */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Recovery & Deload Strategy</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Deload Frequency</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={progressionSettings.deloadFrequency}
                onChange={(e) => setProgressionSettings(prev => ({
                  ...prev,
                  deloadFrequency: e.target.value as any
                }))}
              >
                <option value="every_4_weeks">Every 4 weeks (Beginner)</option>
                <option value="every_6_weeks">Every 6 weeks (Intermediate)</option>
                <option value="every_8_weeks">Every 8 weeks (Advanced)</option>
                <option value="manual">Manual deloads only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Volume Progression Rate</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={progressionSettings.volumeProgression}
                onChange={(e) => setProgressionSettings(prev => ({
                  ...prev,
                  volumeProgression: e.target.value as any
                }))}
              >
                <option value="conservative">Conservative (5-10% per week)</option>
                <option value="moderate">Moderate (10-15% per week)</option>
                <option value="aggressive">Aggressive (15-20% per week)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Deload Strategy</h4>
            <p className="text-sm text-green-700">
              {progressionSettings.deloadFrequency === 'every_4_weeks' && 'Weekly deloads: 40-60% volume reduction, maintain intensity'}
              {progressionSettings.deloadFrequency === 'every_6_weeks' && 'Bi-weekly deloads: 50-70% volume reduction, slight intensity decrease'}
              {progressionSettings.deloadFrequency === 'every_8_weeks' && 'Monthly deloads: 60-80% volume reduction, moderate intensity decrease'}
              {progressionSettings.deloadFrequency === 'manual' && 'Manual deloads: Use when feeling fatigued or progress stalls'}
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setWizardStep('movements')}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Movements
          </button>
          <button
            onClick={() => setWizardStep('complete')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Complete Plan →
          </button>
        </div>
      </div>
    )
  }

  const CompleteWizard = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Training Plan Complete!</h2>
        <p className="text-gray-600">Your periodized training plan has been created successfully.</p>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Plan Created Successfully</h3>
          <p className="text-gray-600 mb-6">
            Your {missionConstraints.total_weeks}-week training plan is ready. You can now save it and start tracking your progress.
          </p>
          <button
            onClick={() => {
              // Save the plan
              const finalPlan: TrainingPlan = {
                id: `plan_${Date.now()}`,
                name: `${missionConstraints.sport || 'Training'} Plan - ${missionConstraints.total_weeks} weeks`,
                description: `Periodized training plan using ${periodizationModel} periodization`,
                category: 'strength',
                difficulty: missionConstraints.training_age,
                duration_weeks: missionConstraints.total_weeks,
                phases: [], // Will be populated
                is_public: false,
                created_by: 'user',
                tags: [periodizationModel, missionConstraints.training_age],
                created_at: new Date().toISOString()
              }
              onSave?.(finalPlan)
            }}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
          >
            Save Training Plan
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setWizardStep('progression')}
          className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          ← Back to Progression
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {wizardStep === 'mission' && <MissionWizard />}
      {wizardStep === 'periodization' && <PeriodizationWizard />}
      {wizardStep === 'structure' && <StructureWizard />}
      {wizardStep === 'training_days' && <TrainingDaysWizard />}
      {wizardStep === 'training_blocks' && <TrainingBlocksWizard />}
      {wizardStep === 'movements' && <MovementsWizard />}
      {wizardStep === 'progression' && <ProgressionWizard />}
      {wizardStep === 'complete' && <CompleteWizard />}
    </div>
  )

}
