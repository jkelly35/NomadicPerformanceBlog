'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export interface Workout {
  id: string
  activity_type: string
  duration_minutes: number
  calories_burned?: number
  intensity: 'Low' | 'Medium' | 'High'
  notes?: string
  workout_date: string
  created_at: string
}

export interface HealthMetric {
  id: string
  metric_type: string
  value: number
  unit?: string
  recorded_date: string
}

export interface Goal {
  id: string
  goal_type: string
  target_value: number
  current_value: number
  period?: string
  is_active: boolean
  target_date?: string
  description?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
}

export interface Event {
  id: string
  event_name: string
  event_date: string
  event_type?: string
  location?: string
  description?: string
  distance?: string
  target_time?: string
  is_active: boolean
}

export interface UserStat {
  stat_type: string
  value: number
  calculated_date: string
}

// Strength Training Types
export interface Exercise {
  id: string
  name: string
  category: 'upper_body' | 'lower_body' | 'full_body' | 'core' | 'cardio' | 'olympic' | 'powerlifting' | 'bodybuilding' | 'functional'
  muscle_groups: string[]
  equipment: string[]
  instructions?: string
  video_url?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  is_custom: boolean
  created_by?: string
  created_at: string
}

export interface ExerciseSet {
  id: string
  exercise_id: string
  set_number: number
  reps?: number
  weight_kg?: number
  weight_lbs?: number
  distance_meters?: number
  distance_miles?: number
  duration_seconds?: number
  pace_min_per_km?: number
  pace_min_per_mile?: number
  rpe?: number // Rate of Perceived Exertion (1-10)
  rest_time_seconds?: number
  notes?: string
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  exercise: Exercise
  order: number
  notes?: string
  sets: ExerciseSet[]
  target_sets?: number
  target_reps?: string // e.g., "3x8-12" or "8,8,6,6"
  target_weight?: string
  target_rpe?: number
}

export interface StrengthWorkout {
  id: string
  user_id: string
  plan_day_id?: string // Links to training plan
  workout_date: string
  name: string
  duration_minutes?: number
  notes?: string
  completed: boolean
  exercises: WorkoutExercise[]
  total_volume?: number // Total weight lifted
  average_rpe?: number
  created_at: string
}

export interface TrainingDay {
  id: string
  week_id: string
  day_number: number
  name: string
  focus: string[]
  exercises: {
    exercise_id: string
    exercise: Exercise
    order: number
    target_sets: number
    target_reps: string
    target_weight?: string
    target_rpe?: number
    rest_time_seconds?: number
    notes?: string
  }[]
  estimated_duration: number
  notes?: string
}

export interface TrainingWeek {
  id: string
  phase_id: string
  week_number: number
  name: string
  focus: string
  days: TrainingDay[]
  notes?: string
}

export interface TrainingPhase {
  id: string
  plan_id: string
  phase_number: number
  name: string
  description: string
  duration_weeks: number
  goal: string
  weeks: TrainingWeek[]
  notes?: string
}

export interface TrainingPlan {
  id: string
  name: string
  description: string
  category: 'strength' | 'powerlifting' | 'bodybuilding' | 'olympic' | 'functional' | 'general'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_weeks: number
  phases: TrainingPhase[]
  is_public: boolean
  created_by: string
  tags: string[]
  created_at: string
}

export interface UserTrainingPlan {
  id: string
  user_id: string
  plan_id: string
  plan: TrainingPlan
  start_date: string
  current_phase: number
  current_week: number
  is_active: boolean
  progress_percentage: number
  notes?: string
  created_at: string
}

export interface StrengthPerformanceMetric {
  id: string
  user_id: string
  exercise_id: string
  exercise: Exercise
  date: string
  metric_type: 'max_weight' | 'volume' | 'strength_gains' | 'endurance' | 'power'
  value: number
  unit: string
  notes?: string
}

export interface FoodItem {
  id: string
  name: string
  brand?: string
  serving_size: number
  serving_unit: string
  calories_per_serving: number
  protein_grams: number
  carbs_grams: number
  fat_grams: number
  fiber_grams: number
  sugar_grams?: number
  sodium_mg?: number
  caffeine_mg?: number
  created_at: string
}

export interface SavedFood {
  id: string
  user_id: string
  food_item_id: string
  created_at: string
  food_item?: FoodItem
}

export interface Micronutrient {
  id: string
  nutrient_code: string
  nutrient_name: string
  nutrient_category: 'vitamin' | 'mineral' | 'electrolyte' | 'other'
  unit: string
  rda_male?: number
  rda_female?: number
  upper_limit?: number
  created_at: string
}

export interface FoodMicronutrient {
  id: string
  food_item_id: string
  micronutrient_id: string
  amount_per_serving: number
  created_at: string
}

export interface HydrationLog {
  id: string
  user_id: string
  amount_ml: number
  beverage_type: string
  logged_time: string
  notes?: string
  created_at: string
}

export interface CaffeineLog {
  id: string
  user_id: string
  amount_mg: number
  source: string
  logged_time: string
  notes?: string
  created_at: string
}

export interface HabitPattern {
  id: string
  user_id: string
  pattern_type: string
  pattern_description: string
  frequency_score: number
  last_detected?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserInsight {
  id: string
  user_id: string
  insight_type: 'weekly_summary' | 'recommendation' | 'correlation' | 'habit_nudge'
  title: string
  description: string
  data?: any
  priority: 1 | 2 | 3
  is_read: boolean
  created_at: string
  expires_at?: string
}

export interface MetricCorrelation {
  id: string
  user_id: string
  primary_metric: string
  secondary_metric: string
  correlation_coefficient: number
  confidence_level: number
  sample_size: number
  time_window_days: number
  last_calculated: string
  is_significant: boolean
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'hydration'
  meal_date: string
  meal_time?: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  notes?: string
  created_at: string
}

export interface MealItem {
  id: string
  meal_id: string
  food_item_id: string
  quantity: number
  custom_calories?: number
  custom_protein?: number
  custom_carbs?: number
  custom_fat?: number
  created_at: string
}

export interface NutritionGoal {
  id: string
  goal_type: string
  target_value: number
  period: string
  is_active: boolean
}

export interface MealTemplate {
  id: string
  user_id: string
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  description?: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface MealTemplateItem {
  id: string
  meal_template_id: string
  food_item_id: string
  quantity: number
  created_at: string
  food_item?: FoodItem
}

export interface EquipmentCategory {
  id: string
  category_name: string
  sport: string
  created_at: string
}

export interface Equipment {
  id: string
  user_id: string
  equipment_name: string
  category_id?: string
  brand?: string
  model?: string
  purchase_date?: string
  purchase_price?: number
  current_value?: number
  mileage_distance: number
  mileage_time: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category?: EquipmentCategory
}

export interface Send {
  id: string
  user_id: string
  sport: string
  activity_date: string
  duration_minutes?: number

  // Climbing specific fields
  climb_type?: string
  climb_name?: string
  climb_grade?: string
  climb_location?: string

  // MTB specific fields
  trail_name?: string
  trail_level?: string
  trail_time?: string
  trail_distance?: number

  // Skiing/Snowboarding specific fields
  mountain_name?: string
  vertical_feet?: number
  runs_completed?: number

  // Running specific fields
  run_distance?: number
  run_time?: string
  run_pace?: string
  run_elevation_gain?: number

  // Equipment used
  equipment_used: string[]

  // General fields
  notes?: string
  rating?: number
  weather_conditions?: string
  partners?: string

  created_at: string
  updated_at: string
}

// Fetch recent workouts
export async function getRecentWorkouts(limit: number = 5): Promise<Workout[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('workout_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching workouts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentWorkouts:', error)
    return []
  }
}

// Get workouts
export async function getWorkouts(): Promise<Workout[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('workout_date', { ascending: false })

    if (error) {
      console.error('Error fetching workouts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getWorkouts:', error)
    return []
  }
}

// Fetch health metrics
export async function getHealthMetrics(): Promise<HealthMetric[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('recorded_date', new Date().toISOString().split('T')[0])
      .order('metric_type')

    if (error) {
      console.error('Error fetching health metrics:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getHealthMetrics:', error)
    return []
  }
}

// Fetch active goals
export async function getActiveGoals(): Promise<Goal[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching goals:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveGoals:', error)
    return []
  }
}

// Fetch active events
export async function getActiveEvents(): Promise<Event[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getActiveEvents:', error)
    return []
  }
}

// Create custom goal
export async function createCustomGoal(goalData: {
  goal_type: string
  target_value: number
  period?: string
  description?: string
  target_date?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
}): Promise<{ success: boolean; error?: string; data?: Goal }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const goalPayload = {
      user_id: user.id,
      goal_type: goalData.goal_type,
      target_value: goalData.target_value,
      current_value: 0,
      period: goalData.period || null,
      is_active: true,
      description: goalData.description || null,
      target_date: goalData.target_date || null,
      category: goalData.category || null,
      priority: goalData.priority || 'medium'
    }

    const { data, error } = await supabase
      .from('goals')
      .insert([goalPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating custom goal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createCustomGoal:', error)
    return { success: false, error: 'Failed to create custom goal' }
  }
}

// Update a custom goal
export async function updateCustomGoal(goalId: string, goalData: {
  goal_type?: string
  target_value?: number
  period?: string
  description?: string
  target_date?: string
  category?: string
  priority?: 'low' | 'medium' | 'high'
  is_active?: boolean
}): Promise<{ success: boolean; error?: string; data?: Goal }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('goals')
      .update(goalData)
      .eq('id', goalId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating custom goal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateCustomGoal:', error)
    return { success: false, error: 'Failed to update custom goal' }
  }
}

// Delete a custom goal
export async function deleteCustomGoal(goalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting custom goal:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCustomGoal:', error)
    return { success: false, error: 'Failed to delete custom goal' }
  }
}

// Event CRUD functions

// Create event
export async function createEvent(eventData: {
  event_name: string
  event_date: string
  event_type?: string
  location?: string
  description?: string
  distance?: string
  target_time?: string
}): Promise<{ success: boolean; error?: string; data?: Event }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const eventPayload = {
      user_id: user.id,
      event_name: eventData.event_name,
      event_date: eventData.event_date,
      event_type: eventData.event_type || null,
      location: eventData.location || null,
      description: eventData.description || null,
      distance: eventData.distance || null,
      target_time: eventData.target_time || null,
      is_active: true
    }

    const { data, error } = await supabase
      .from('events')
      .insert([eventPayload])
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createEvent:', error)
    return { success: false, error: 'Failed to create event' }
  }
}

// Update event
export async function updateEvent(eventId: string, eventData: {
  event_name?: string
  event_date?: string
  event_type?: string
  location?: string
  description?: string
  distance?: string
  target_time?: string
  is_active?: boolean
}): Promise<{ success: boolean; error?: string; data?: Event }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateEvent:', error)
    return { success: false, error: 'Failed to update event' }
  }
}

// Delete event
export async function deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting event:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteEvent:', error)
    return { success: false, error: 'Failed to delete event' }
  }
}

// Fetch user stats
export async function getUserStats(): Promise<UserStat[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('calculated_date', new Date().toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching user stats:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserStats:', error)
    return []
  }
}

// Calculate weekly workout stats
export async function getWeeklyWorkoutStats() {
  try {
    const supabase = await createClient()

    // Get workouts from the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('duration_minutes, workout_date')
      .gte('workout_date', sevenDaysAgo.toISOString().split('T')[0])

    if (error) {
      console.error('Error fetching weekly workouts:', error)
      return { count: 0, totalMinutes: 0 }
    }

    const count = workouts?.length || 0
    const totalMinutes = workouts?.reduce((sum, workout) => sum + workout.duration_minutes, 0) || 0

    return { count, totalMinutes }
  } catch (error) {
    console.error('Error in getWeeklyWorkoutStats:', error)
    return { count: 0, totalMinutes: 0 }
  }
}

// Log a new workout
export async function logWorkout(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const activity_type = formData.get('activity_type') as string
    const duration_minutes = parseInt(formData.get('duration_minutes') as string)
    const calories_burned = formData.get('calories_burned') ? parseInt(formData.get('calories_burned') as string) : null
    const intensity = formData.get('intensity') as 'Low' | 'Medium' | 'High'
    const notes = formData.get('notes') as string
    const workout_date = formData.get('workout_date') as string || (() => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        activity_type,
        duration_minutes,
        calories_burned,
        intensity,
        notes,
        workout_date
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging workout:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in logWorkout:', error)
    return { success: false, error: 'Failed to log workout' }
  }
}

// Update health metrics
export async function updateHealthMetrics(formData: FormData) {
  try {
    const supabase = await createClient()

    const metrics = [
      {
        metric_type: 'resting_hr',
        value: parseFloat(formData.get('resting_hr') as string),
        unit: 'bpm'
      },
      {
        metric_type: 'sleep_quality',
        value: parseFloat(formData.get('sleep_quality') as string),
        unit: '%'
      },
      {
        metric_type: 'body_fat',
        value: parseFloat(formData.get('body_fat') as string),
        unit: '%'
      }
    ]

    const { data, error } = await supabase
      .from('health_metrics')
      .upsert(metrics, {
        onConflict: 'user_id,metric_type,recorded_date'
      })

    if (error) {
      console.error('Error updating health metrics:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateHealthMetrics:', error)
    return { success: false, error: 'Failed to update health metrics' }
  }
}

// Update user stats (fitness score, recovery score, etc.)
export async function updateUserStats(formData: FormData) {
  try {
    const supabase = await createClient()

    const stats = [
      {
        stat_type: 'fitness_score',
        value: parseFloat(formData.get('fitness_score') as string)
      },
      {
        stat_type: 'recovery_score',
        value: parseFloat(formData.get('recovery_score') as string)
      },
      {
        stat_type: 'streak_days',
        value: parseInt(formData.get('streak_days') as string)
      }
    ]

    const { data, error } = await supabase
      .from('user_stats')
      .upsert(stats, {
        onConflict: 'user_id,stat_type,calculated_date'
      })

    if (error) {
      console.error('Error updating user stats:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateUserStats:', error)
    return { success: false, error: 'Failed to update user stats' }
  }
}

// Nutrition functions

// Get recent meals
export async function getRecentMeals(limit: number = 10): Promise<Meal[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('meal_date', { ascending: false })
      .order('meal_time', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching meals:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getRecentMeals:', error)
    return []
  }
}

// Get meals for a specific date
export async function getMealsByDate(date: string): Promise<Meal[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('meal_date', date)
      .order('meal_time', { ascending: true })

    if (error) {
      console.error('Error fetching meals by date:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getMealsByDate:', error)
    return []
  }
}

// Get nutrition goals
export async function getNutritionGoals(): Promise<NutritionGoal[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('is_active', true)
      .order('goal_type')

    if (error) {
      console.error('Error fetching nutrition goals:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getNutritionGoals:', error)
    return []
  }
}

// Create or update nutrition goal
export async function upsertNutritionGoal(goalData: {
  goal_type: string
  target_value: number
  period?: string
  is_active?: boolean
}): Promise<{ success: boolean; error?: string; data?: NutritionGoal }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if goal already exists
    const { data: existingGoal } = await supabase
      .from('nutrition_goals')
      .select('id')
      .eq('goal_type', goalData.goal_type)
      .eq('user_id', user.id)
      .single()

    const goalPayload = {
      user_id: user.id,
      goal_type: goalData.goal_type,
      target_value: goalData.target_value,
      period: goalData.period || 'daily',
      is_active: goalData.is_active !== undefined ? goalData.is_active : true
    }

    let result
    if (existingGoal) {
      // Update existing goal
      result = await supabase
        .from('nutrition_goals')
        .update(goalPayload)
        .eq('id', existingGoal.id)
        .select()
        .single()
    } else {
      // Create new goal
      result = await supabase
        .from('nutrition_goals')
        .insert([goalPayload])
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error upserting nutrition goal:', result.error)
      return { success: false, error: result.error.message }
    }

    revalidatePath('/nutrition')
    revalidatePath('/dashboard')
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error in upsertNutritionGoal:', error)
    return { success: false, error: 'Failed to save nutrition goal' }
  }
}

// Get daily nutrition stats
export async function getDailyNutritionStats(date: string): Promise<{
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  meals_count: number
}> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meals')
      .select('total_calories, total_protein, total_carbs, total_fat, total_fiber')
      .eq('meal_date', date)

    if (error) {
      console.error('Error fetching daily nutrition stats:', error)
      return {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
        meals_count: 0
      }
    }

    const stats = (data || []).reduce(
      (acc: {
        total_calories: number
        total_protein: number
        total_carbs: number
        total_fat: number
        total_fiber: number
        meals_count: number
      }, meal) => ({
        total_calories: acc.total_calories + (meal.total_calories || 0),
        total_protein: acc.total_protein + (meal.total_protein || 0),
        total_carbs: acc.total_carbs + (meal.total_carbs || 0),
        total_fat: acc.total_fat + (meal.total_fat || 0),
        total_fiber: acc.total_fiber + (meal.total_fiber || 0),
        meals_count: acc.meals_count + 1
      }),
      {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
        meals_count: 0
      }
    )

    return stats
  } catch (error) {
    console.error('Error in getDailyNutritionStats:', error)
    return {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      total_fiber: 0,
      meals_count: 0
    }
  }
}

// Log a new meal
export async function logMeal(formData: FormData): Promise<{ success: boolean; error?: string; data?: Meal }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Parse meal data
    const mealType = formData.get('meal_type') as string
    const mealDate = formData.get('meal_date') as string || (() => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()
    const mealTime = formData.get('meal_time') as string || null
    const notes = formData.get('notes') as string || null

    // Parse food items from FormData
    const foodItems: Array<{ foodId: string; quantity: number }> = []
    let index = 0
    while (true) {
      const foodId = formData.get(`food_${index}`) as string
      const quantity = formData.get(`quantity_${index}`) as string

      if (!foodId || !quantity) break

      foodItems.push({
        foodId,
        quantity: parseFloat(quantity)
      })
      index++
    }

    if (foodItems.length === 0) {
      return { success: false, error: 'No food items provided' }
    }

    // Fetch food details for calculation
    const { data: foods, error: foodsError } = await supabase
      .from('food_items')
      .select('*')
      .in('id', foodItems.map(item => item.foodId))

    if (foodsError || !foods) {
      console.error('Error fetching food details:', foodsError)
      return { success: false, error: 'Failed to fetch food details' }
    }

    // Calculate total nutrition
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    const mealItems = foodItems.map(item => {
      const food = foods.find(f => f.id === item.foodId)
      if (!food) return null

      const multiplier = item.quantity / food.serving_size
      const calories = food.calories_per_serving * multiplier
      const protein = food.protein_grams * multiplier
      const carbs = food.carbs_grams * multiplier
      const fat = food.fat_grams * multiplier
      const fiber = food.fiber_grams * multiplier

      totalCalories += calories
      totalProtein += protein
      totalCarbs += carbs
      totalFat += fat
      totalFiber += fiber

      return {
        food_item_id: item.foodId,
        quantity: item.quantity
      }
    }).filter(Boolean)

    // Insert meal
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert([{
        user_id: user.id,
        meal_type: mealType,
        meal_date: mealDate,
        meal_time: mealTime,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        total_fiber: totalFiber,
        notes
      }])
      .select()
      .single()

    if (mealError) {
      console.error('Error logging meal:', mealError)
      return { success: false, error: 'Failed to log meal' }
    }

    // Insert meal items
    const mealItemsWithMealId = mealItems.map(item => ({
      ...item,
      meal_id: meal.id
    }))

    const { error: itemsError } = await supabase
      .from('meal_items')
      .insert(mealItemsWithMealId)

    if (itemsError) {
      console.error('Error logging meal items:', itemsError)
      // Don't fail the whole operation if meal items fail, but log it
    }

    revalidatePath('/dashboard')
    revalidatePath('/nutrition')
    return { success: true, data: meal }
  } catch (error) {
    console.error('Error in logMeal:', error)
    return { success: false, error: 'Failed to log meal' }
  }
}

// Delete a meal
export async function deleteMeal(mealId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    // First get the meal to check if it's a hydration entry
    const { data: meal, error: getMealError } = await supabase
      .from('meals')
      .select('meal_type, notes, meal_date')
      .eq('id', mealId)
      .eq('user_id', user.id)
      .single()

    if (getMealError) {
      console.error('Error getting meal:', getMealError)
      return { success: false, error: 'Failed to get meal' }
    }

    // If this is a hydration meal, also delete the corresponding hydration log
    if (meal.meal_type === 'hydration') {
      // Parse amount from notes (format: "💧 Hydration: 500ml - notes" or "💧 Hydration: 500ml")
      const amountMatch = meal.notes?.match(/(\d+)ml/)
      if (amountMatch) {
        const amount_ml = parseInt(amountMatch[1])
        const { error: hydrationError } = await supabase
          .from('hydration_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('amount_ml', amount_ml)
          .eq('created_at', meal.meal_date) // Assuming hydration logs are created on the same date

        if (hydrationError) {
          console.error('Error deleting hydration log:', hydrationError)
          // Don't fail the whole operation if hydration log deletion fails
        }
      }
    }

    // Delete meal items first (due to foreign key constraint)
    const { error: itemsError } = await supabase
      .from('meal_items')
      .delete()
      .eq('meal_id', mealId)

    if (itemsError) {
      console.error('Error deleting meal items:', itemsError)
      return { success: false, error: 'Failed to delete meal items' }
    }

    // Delete the meal
    const { error: mealError } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id) // Ensure user can only delete their own meals

    if (mealError) {
      console.error('Error deleting meal:', mealError)
      return { success: false, error: 'Failed to delete meal' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/nutrition')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteMeal:', error)
    return { success: false, error: 'Failed to delete meal' }
  }
}

// Get food items (for meal logging)
export async function getFoodItems(search?: string): Promise<FoodItem[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('food_items')
      .select('*')
      .order('name')

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      console.error('Error fetching food items:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getFoodItems:', error)
    return []
  }
}

// Create a new food item
export async function createFoodItem(formData: FormData): Promise<{ success: boolean; error?: string; data?: FoodItem }> {
  try {
    const supabase = await createClient()

    const foodData = {
      name: formData.get('name') as string,
      brand: formData.get('brand') as string || null,
      serving_size: parseFloat(formData.get('serving_size') as string),
      serving_unit: formData.get('serving_unit') as string,
      calories_per_serving: parseInt(formData.get('calories_per_serving') as string),
      protein_grams: parseFloat(formData.get('protein_grams') as string) || 0,
      carbs_grams: parseFloat(formData.get('carbs_grams') as string) || 0,
      fat_grams: parseFloat(formData.get('fat_grams') as string) || 0,
      fiber_grams: parseFloat(formData.get('fiber_grams') as string) || 0,
      sugar_grams: parseFloat(formData.get('sugar_grams') as string) || 0,
      sodium_mg: parseFloat(formData.get('sodium_mg') as string) || 0,
      caffeine_mg: parseFloat(formData.get('caffeine_mg') as string) || 0
    }

    const { data, error } = await supabase
      .from('food_items')
      .insert([foodData])
      .select()
      .single()

    if (error) {
      console.error('Error creating food item:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createFoodItem:', error)
    return { success: false, error: 'Failed to create food item' }
  }
}

// Update a food item
export async function updateFoodItem(foodId: string, formData: FormData): Promise<{ success: boolean; error?: string; data?: FoodItem }> {
  try {
    const supabase = await createClient()

    const foodData = {
      name: formData.get('name') as string,
      brand: formData.get('brand') as string || null,
      serving_size: parseFloat(formData.get('serving_size') as string),
      serving_unit: formData.get('serving_unit') as string,
      calories_per_serving: parseInt(formData.get('calories_per_serving') as string),
      protein_grams: parseFloat(formData.get('protein_grams') as string) || 0,
      carbs_grams: parseFloat(formData.get('carbs_grams') as string) || 0,
      fat_grams: parseFloat(formData.get('fat_grams') as string) || 0,
      fiber_grams: parseFloat(formData.get('fiber_grams') as string) || 0,
      sugar_grams: parseFloat(formData.get('sugar_grams') as string) || 0,
      sodium_mg: parseFloat(formData.get('sodium_mg') as string) || 0,
      caffeine_mg: parseFloat(formData.get('caffeine_mg') as string) || 0,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('food_items')
      .update(foodData)
      .eq('id', foodId)
      .select()
      .single()

    if (error) {
      console.error('Error updating food item:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateFoodItem:', error)
    return { success: false, error: 'Failed to update food item' }
  }
}

// Delete a food item
export async function deleteFoodItem(foodId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', foodId)

    if (error) {
      console.error('Error deleting food item:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteFoodItem:', error)
    return { success: false, error: 'Failed to delete food item' }
  }
}

// Meal Template Functions

// Get all meal templates for the current user
export async function getMealTemplates(): Promise<MealTemplate[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('meal_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching meal templates:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getMealTemplates:', error)
    return []
  }
}

// Get a specific meal template with its items
export async function getMealTemplateWithItems(templateId: string): Promise<{ template: MealTemplate | null; items: MealTemplateItem[] }> {
  try {
    const supabase = await createClient()

    const { data: template, error: templateError } = await supabase
      .from('meal_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError) {
      console.error('Error fetching meal template:', templateError)
      return { template: null, items: [] }
    }

    const { data: items, error: itemsError } = await supabase
      .from('meal_template_items')
      .select(`
        *,
        food_item:food_items(*)
      `)
      .eq('meal_template_id', templateId)

    if (itemsError) {
      console.error('Error fetching meal template items:', itemsError)
      return { template, items: [] }
    }

    return { template, items: items || [] }
  } catch (error) {
    console.error('Error in getMealTemplateWithItems:', error)
    return { template: null, items: [] }
  }
}

// Create a new meal template
export async function createMealTemplate(formData: FormData, userId: string): Promise<{ success: boolean; error?: string; data?: MealTemplate }> {
  try {
    const supabase = await createClient()

    console.log('Creating meal template for user:', userId)

    const name = formData.get('name') as string
    const mealType = formData.get('meal_type') as string
    const description = formData.get('description') as string
    const foodItems = JSON.parse(formData.get('food_items') as string) as Array<{ food_item_id: string; quantity: number }>

    if (!name || name.trim() === '') {
      return { success: false, error: 'Template name is required' }
    }

    if (!mealType) {
      return { success: false, error: 'Meal type is required' }
    }

    if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
      return { success: false, error: 'At least one food item is required' }
    }

    // Calculate totals from food items
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    for (const item of foodItems) {
      const { data: foodItem } = await supabase
        .from('food_items')
        .select('calories_per_serving, protein_grams, carbs_grams, fat_grams, fiber_grams')
        .eq('id', item.food_item_id)
        .single()

      if (foodItem) {
        totalCalories += Math.round(foodItem.calories_per_serving * item.quantity)
        totalProtein += foodItem.protein_grams * item.quantity
        totalCarbs += foodItem.carbs_grams * item.quantity
        totalFat += foodItem.fat_grams * item.quantity
        totalFiber += foodItem.fiber_grams * item.quantity
      }
    }

    // Create the meal template
    const { data: template, error: templateError } = await supabase
      .from('meal_templates')
      .insert({
        user_id: userId,
        name,
        meal_type: mealType,
        description,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        total_fiber: totalFiber,
      })
      .select()
      .single()

    if (templateError) {
      console.error('Error creating meal template:', templateError)
      return { success: false, error: templateError.message }
    }

    // Create the meal template items
    const templateItems = foodItems.map(item => ({
      meal_template_id: template.id,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('meal_template_items')
      .insert(templateItems)

    if (itemsError) {
      console.error('Error creating meal template items:', itemsError)
      // Clean up the template if items failed
      await supabase.from('meal_templates').delete().eq('id', template.id)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/nutrition')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error in createMealTemplate:', error)
    return { success: false, error: 'Failed to create meal template' }
  }
}

// Update a meal template
export async function updateMealTemplate(templateId: string, formData: FormData): Promise<{ success: boolean; error?: string; data?: MealTemplate }> {
  try {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const mealType = formData.get('meal_type') as string
    const description = formData.get('description') as string
    const foodItems = JSON.parse(formData.get('food_items') as string) as Array<{ food_item_id: string; quantity: number }>

    if (!name || !mealType || !foodItems) {
      return { success: false, error: 'Missing required fields' }
    }

    // Calculate totals from food items
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0

    for (const item of foodItems) {
      const { data: foodItem } = await supabase
        .from('food_items')
        .select('calories_per_serving, protein_grams, carbs_grams, fat_grams, fiber_grams')
        .eq('id', item.food_item_id)
        .single()

      if (foodItem) {
        totalCalories += Math.round(foodItem.calories_per_serving * item.quantity)
        totalProtein += foodItem.protein_grams * item.quantity
        totalCarbs += foodItem.carbs_grams * item.quantity
        totalFat += foodItem.fat_grams * item.quantity
        totalFiber += foodItem.fiber_grams * item.quantity
      }
    }

    // Update the meal template
    const { data: template, error: templateError } = await supabase
      .from('meal_templates')
      .update({
        name,
        meal_type: mealType,
        description,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat,
        total_fiber: totalFiber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single()

    if (templateError) {
      console.error('Error updating meal template:', templateError)
      return { success: false, error: templateError.message }
    }

    // Delete existing items and create new ones
    await supabase.from('meal_template_items').delete().eq('meal_template_id', templateId)

    const templateItems = foodItems.map(item => ({
      meal_template_id: templateId,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('meal_template_items')
      .insert(templateItems)

    if (itemsError) {
      console.error('Error updating meal template items:', itemsError)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/nutrition')
    return { success: true, data: template }
  } catch (error) {
    console.error('Error in updateMealTemplate:', error)
    return { success: false, error: 'Failed to update meal template' }
  }
}

// Delete a meal template
export async function deleteMealTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('meal_templates')
      .delete()
      .eq('id', templateId)

    if (error) {
      console.error('Error deleting meal template:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteMealTemplate:', error)
    return { success: false, error: 'Failed to delete meal template' }
  }
}

// Log a meal from a template
export async function logMealFromTemplate(templateId: string, mealDate: string, mealTime?: string, userId?: string): Promise<{ success: boolean; error?: string; data?: Meal }> {
  try {
    const supabase = await createClient()

    // Use provided userId or get current user
    let currentUserId = userId
    if (!currentUserId) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' }
      }
      currentUserId = user.id
    }

    // Get the template with items
    const { template, items } = await getMealTemplateWithItems(templateId)

    if (!template || items.length === 0) {
      return { success: false, error: 'Meal template not found or empty' }
    }

    // Create the meal
    const { data: meal, error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: currentUserId,
        meal_type: template.meal_type,
        meal_date: mealDate,
        meal_time: mealTime,
        total_calories: template.total_calories,
        total_protein: template.total_protein,
        total_carbs: template.total_carbs,
        total_fat: template.total_fat,
        total_fiber: template.total_fiber,
        notes: `From template: ${template.name}`,
      })
      .select()
      .single()

    if (mealError) {
      console.error('Error creating meal from template:', mealError)
      return { success: false, error: mealError.message }
    }

    // Create the meal items
    const mealItems = items.map(item => ({
      meal_id: meal.id,
      food_item_id: item.food_item_id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('meal_items')
      .insert(mealItems)

    if (itemsError) {
      console.error('Error creating meal items from template:', itemsError)
      // Clean up the meal if items failed
      await supabase.from('meals').delete().eq('id', meal.id)
      return { success: false, error: itemsError.message }
    }

    revalidatePath('/nutrition')
    return { success: true, data: meal }
  } catch (error) {
    console.error('Error in logMealFromTemplate:', error)
    return { success: false, error: 'Failed to log meal from template' }
  }
}

// ===== ADVANCED NUTRITION FEATURES =====

// Get all micronutrients
export async function getMicronutrients(): Promise<Micronutrient[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('micronutrients')
      .select('*')
      .order('nutrient_category', { ascending: true })
      .order('nutrient_name', { ascending: true })

    if (error) {
      console.error('Error fetching micronutrients:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getMicronutrients:', error)
    return []
  }
}

// Get micronutrients for a specific food item
export async function getFoodMicronutrients(foodItemId: string): Promise<FoodMicronutrient[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('food_micronutrients')
      .select(`
        *,
        micronutrient:micronutrients(*)
      `)
      .eq('food_item_id', foodItemId)

    if (error) {
      console.error('Error fetching food micronutrients:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getFoodMicronutrients:', error)
    return []
  }
}

// Log hydration
export async function logHydration(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const amount_ml = parseInt(formData.get('amount_ml') as string)
    const notes = formData.get('notes') as string

    // Insert hydration log
    const { data: hydrationData, error: hydrationError } = await supabase
      .from('hydration_logs')
      .insert({
        user_id: user.id,
        amount_ml,
        beverage_type: 'water',
        notes
      })
      .select()
      .single()

    if (hydrationError) {
      console.error('Error logging hydration:', hydrationError)
      return { success: false, error: hydrationError.message }
    }

    // Also create a meal entry for hydration so it appears in meal history
    const hydrationNotes = notes ? `💧 Hydration: ${amount_ml}ml - ${notes}` : `💧 Hydration: ${amount_ml}ml`
    const today = (() => {
      const d = new Date()
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()
    const { error: mealError } = await supabase
      .from('meals')
      .insert({
        user_id: user.id,
        meal_type: 'hydration',
        meal_date: today,
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
        notes: hydrationNotes
      })

    if (mealError) {
      console.error('Error creating hydration meal entry:', mealError)
      // Don't fail the whole operation if meal creation fails, but log it
    }

    revalidatePath('/nutrition')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error in logHydration:', error)
    return { success: false, error: 'Failed to log hydration' }
  }
}

// Get hydration logs for a date range
export async function getHydrationLogs(startDate?: string, endDate?: string): Promise<HydrationLog[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('hydration_logs')
      .select('*')
      .order('logged_time', { ascending: false })

    if (startDate) {
      query = query.gte('logged_time', startDate)
    }
    if (endDate) {
      query = query.lte('logged_time', endDate)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching hydration logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getHydrationLogs:', error)
    return []
  }
}

// Get daily hydration total
export async function getDailyHydrationTotal(date: string): Promise<number> {
  try {
    const supabase = await createClient()

    // Get hydration from meals table where meal_type = 'hydration'
    const { data, error } = await supabase
      .from('meals')
      .select('notes')
      .eq('meal_date', date)
      .eq('meal_type', 'hydration')

    if (error) {
      console.error('Error fetching daily hydration from meals:', error)
      return 0
    }

    // Parse hydration amounts from notes (format: "💧 Hydration: 500ml" or "💧 Hydration: 500ml - notes")
    const total = (data || []).reduce((sum, meal) => {
      const match = meal.notes?.match(/💧 Hydration: (\d+)ml/)
      return sum + (match ? parseInt(match[1]) : 0)
    }, 0)

    return total
  } catch (error) {
    console.error('Error in getDailyHydrationTotal:', error)
    return 0
  }
}

// Log caffeine intake
export async function logCaffeine(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const amount_mg = parseInt(formData.get('amount_mg') as string)
    const source = formData.get('source') as string
    const notes = formData.get('notes') as string

    const { data, error } = await supabase
      .from('caffeine_logs')
      .insert({
        amount_mg,
        source,
        notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging caffeine:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true }
  } catch (error) {
    console.error('Error in logCaffeine:', error)
    return { success: false, error: 'Failed to log caffeine' }
  }
}

// Get caffeine logs for a date range
export async function getCaffeineLogs(startDate?: string, endDate?: string): Promise<CaffeineLog[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('caffeine_logs')
      .select('*')
      .order('logged_time', { ascending: false })

    if (startDate) {
      query = query.gte('logged_time', startDate)
    }
    if (endDate) {
      query = query.lte('logged_time', endDate)
    }

    const { data, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching caffeine logs:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getCaffeineLogs:', error)
    return []
  }
}

// Get daily caffeine total
export async function getDailyCaffeineTotal(date: string): Promise<number> {
  try {
    const supabase = await createClient()

    // Parse the date string as local date and create UTC boundaries
    const [year, month, day] = date.split('-').map(Number)
    const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
    const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))

    // Get caffeine from manual logs
    const { data: manualLogs, error: manualError } = await supabase
      .from('caffeine_logs')
      .select('amount_mg')
      .gte('logged_time', startOfDay.toISOString())
      .lte('logged_time', endOfDay.toISOString())

    if (manualError) {
      console.error('Error fetching manual caffeine logs:', manualError)
    }

    const manualCaffeine = manualLogs?.reduce((total, log) => total + log.amount_mg, 0) || 0

    // Get caffeine from meals logged on this date
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('id')
      .eq('meal_date', date)

    if (mealsError) {
      console.error('Error fetching meals for caffeine calculation:', mealsError)
    }

    let mealCaffeine = 0
    if (meals && meals.length > 0) {
      const mealIds = meals.map(meal => meal.id)

      // Get meal items with food data
      const { data: mealItems, error: itemsError } = await supabase
        .from('meal_items')
        .select(`
          quantity,
          food_items!inner(caffeine_mg, serving_size)
        `)
        .in('meal_id', mealIds)

      if (itemsError) {
        console.error('Error fetching meal items for caffeine calculation:', itemsError)
      } else if (mealItems) {
        for (const item of mealItems) {
          const foodItem = item.food_items as any
          if (foodItem?.caffeine_mg && foodItem?.serving_size) {
            const multiplier = item.quantity / foodItem.serving_size
            mealCaffeine += foodItem.caffeine_mg * multiplier
          }
        }
      }
    }

    return manualCaffeine + mealCaffeine
  } catch (error) {
    console.error('Error in getDailyCaffeineTotal:', error)
    return 0
  }
}

// Get user insights
export async function getUserInsights(limit: number = 10): Promise<UserInsight[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_insights')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user insights:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getUserInsights:', error)
    return []
  }
}

// Mark insight as read
export async function markInsightAsRead(insightId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_insights')
      .update({ is_read: true })
      .eq('id', insightId)

    if (error) {
      console.error('Error marking insight as read:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in markInsightAsRead:', error)
    return { success: false, error: 'Failed to mark insight as read' }
  }
}

// Get habit patterns
export async function getHabitPatterns(): Promise<HabitPattern[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('habit_patterns')
      .select('*')
      .eq('is_active', true)
      .order('frequency_score', { ascending: false })

    if (error) {
      console.error('Error fetching habit patterns:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getHabitPatterns:', error)
    return []
  }
}

// Get metric correlations
export async function getMetricCorrelations(): Promise<MetricCorrelation[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('metric_correlations')
      .select('*')
      .eq('is_significant', true)
      .order('correlation_coefficient', { ascending: false })

    if (error) {
      console.error('Error fetching metric correlations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getMetricCorrelations:', error)
    return []
  }
}

// Generate weekly nutrition insights
export async function generateWeeklyInsights(): Promise<{ success: boolean; insights: UserInsight[] }> {
  try {
    const supabase = await createClient()

    // Get data for the last 7 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    // Get nutrition data
    const [meals, hydration, caffeine, goals] = await Promise.all([
      supabase.from('meals').select('*').gte('meal_date', startDate.toISOString().split('T')[0]).lte('meal_date', endDate.toISOString().split('T')[0]),
      supabase.from('hydration_logs').select('*').gte('logged_time', startDate.toISOString()).lte('logged_time', endDate.toISOString()),
      supabase.from('caffeine_logs').select('*').gte('logged_time', startDate.toISOString()).lte('logged_time', endDate.toISOString()),
      supabase.from('nutrition_goals').select('*').eq('is_active', true)
    ])

    const insights: Omit<UserInsight, 'id' | 'user_id' | 'created_at'>[] = []

    // Analyze protein goal achievement
    if (goals.data && goals.data.length > 0) {
      const proteinGoal = goals.data.find(g => g.goal_type === 'protein_target')
      if (proteinGoal) {
        const daysWithMeals = meals.data?.length || 0
        const daysMeetingProtein = meals.data?.filter(meal =>
          (meal.total_protein || 0) >= proteinGoal.target_value
        ).length || 0

        if (daysWithMeals > 0) {
          const percentage = Math.round((daysMeetingProtein / daysWithMeals) * 100)
          insights.push({
            insight_type: 'weekly_summary',
            title: `Protein Goal Achievement`,
            description: `You hit your protein goal on ${daysMeetingProtein}/${daysWithMeals} days this week (${percentage}%). ${percentage >= 80 ? 'Great job!' : 'Consider adding more protein-rich foods.'}`,
            priority: percentage >= 80 ? 1 : 2,
            is_read: false,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
        }
      }
    }

    // Analyze hydration patterns
    const totalHydration = hydration.data?.reduce((sum, log) => sum + log.amount_ml, 0) || 0
    const avgDailyHydration = Math.round(totalHydration / 7)

    if (avgDailyHydration < 2000) {
      insights.push({
        insight_type: 'recommendation',
        title: 'Hydration Reminder',
        description: `Your average daily water intake is ${avgDailyHydration}ml. Aim for at least 2000-3000ml per day for optimal hydration.`,
        priority: 2,
        is_read: false,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    // Analyze caffeine patterns
    const totalCaffeine = caffeine.data?.reduce((sum, log) => sum + log.amount_mg, 0) || 0
    const avgDailyCaffeine = Math.round(totalCaffeine / 7)

    if (avgDailyCaffeine > 400) {
      insights.push({
        insight_type: 'habit_nudge',
        title: 'High Caffeine Intake',
        description: `Your average daily caffeine intake is ${avgDailyCaffeine}mg. Consider reducing to under 400mg for better sleep quality.`,
        priority: 2,
        is_read: false,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      })
    }

    // Insert insights into database
    if (insights.length > 0) {
      const { data, error } = await supabase
        .from('user_insights')
        .insert(insights)
        .select()

      if (error) {
        console.error('Error inserting insights:', error)
        return { success: false, insights: [] }
      }

      return { success: true, insights: data || [] }
    }

    return { success: true, insights: [] }
  } catch (error) {
    console.error('Error in generateWeeklyInsights:', error)
    return { success: false, insights: [] }
  }
}

// Saved Foods functions
export async function getSavedFoods(userId: string): Promise<{ success: boolean; error?: string; data?: SavedFood[] }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('saved_foods')
      .select(`
        *,
        food_item:food_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved foods:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getSavedFoods:', error)
    return { success: false, error: 'Failed to fetch saved foods' }
  }
}

export async function saveFood(userId: string, foodItemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('saved_foods')
      .insert({
        user_id: userId,
        food_item_id: foodItemId,
      })

    if (error) {
      console.error('Error saving food:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true }
  } catch (error) {
    console.error('Error in saveFood:', error)
    return { success: false, error: 'Failed to save food' }
  }
}

export async function removeSavedFood(savedFoodId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('saved_foods')
      .delete()
      .eq('id', savedFoodId)

    if (error) {
      console.error('Error removing saved food:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
    return { success: true }
  } catch (error) {
    console.error('Error in removeSavedFood:', error)
    return { success: false, error: 'Failed to remove saved food' }
  }
}

// Get daily micronutrient intake for a specific date
export async function getDailyMicronutrientIntake(date: string): Promise<{ [key: string]: number }> {
  try {
    const supabase = await createClient()

    // Get all meals for the date
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('id')
      .eq('meal_date', date)

    if (mealsError) {
      console.error('Error fetching meals for micronutrient calculation:', mealsError)
      return {}
    }

    if (!meals || meals.length === 0) {
      return {}
    }

    const mealIds = meals.map(meal => meal.id)

    // Get all meal items for these meals
    const { data: mealItems, error: itemsError } = await supabase
      .from('meal_items')
      .select('food_item_id, quantity')
      .in('meal_id', mealIds)

    if (itemsError) {
      console.error('Error fetching meal items for micronutrient calculation:', itemsError)
      return {}
    }

    if (!mealItems || mealItems.length === 0) {
      return {}
    }

    // Get unique food item IDs
    const foodItemIds = [...new Set(mealItems.map(item => item.food_item_id))]

    // Get all micronutrients data first
    const { data: allMicronutrients, error: microError } = await supabase
      .from('micronutrients')
      .select('id, nutrient_name')

    if (microError) {
      console.error('Error fetching micronutrients:', microError)
      return {}
    }

    const micronutrientMap = new Map(allMicronutrients?.map(m => [m.id, m.nutrient_name]) || [])

    // Get micronutrients for all food items
    const { data: foodMicronutrients, error: micronutrientsError } = await supabase
      .from('food_micronutrients')
      .select('food_item_id, micronutrient_id, amount')
      .in('food_item_id', foodItemIds)

    if (micronutrientsError) {
      console.error('Error fetching food micronutrients:', micronutrientsError)
      return {}
    }

    // Calculate total intake by micronutrient
    const intakeByMicronutrient: { [key: string]: number } = {}

    for (const mealItem of mealItems) {
      const itemMicronutrients = foodMicronutrients?.filter(m => m.food_item_id === mealItem.food_item_id) || []

      for (const micro of itemMicronutrients) {
        const nutrientName = micronutrientMap.get(micro.micronutrient_id)
        if (nutrientName) {
          const amount = (micro.amount || 0) * mealItem.quantity
          intakeByMicronutrient[nutrientName] = (intakeByMicronutrient[nutrientName] || 0) + amount
        }
      }
    }

    return intakeByMicronutrient
  } catch (error) {
    console.error('Error in getDailyMicronutrientIntake:', error)
    return {}
  }
}

// Readiness scoring types and functions
export interface ReadinessMetric {
  id: string
  recorded_date: string
  // Recovery metrics
  hrv?: number
  resting_hr?: number
  sleep_hours?: number
  sleep_quality?: number
  // Subjective wellness
  fatigue?: number
  soreness?: number
  mood?: number
  stress?: number
  // Fueling and hydration
  energy_intake?: number
  energy_burn?: number
  hydration_ml?: number
  // Training load
  training_load?: number
  acute_load?: number
  chronic_load?: number
  // Environmental factors
  temperature?: number
  altitude?: number
  illness?: boolean
  travel?: boolean
  // Calculated scores
  recovery_score?: number
  wellness_score?: number
  fueling_score?: number
  load_score?: number
  context_score?: number
  overall_readiness?: number
  notes?: string
}

export async function getReadinessMetrics(date: string): Promise<ReadinessMetric | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('readiness_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('recorded_date', date)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching readiness metrics:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getReadinessMetrics:', error)
    return null
  }
}

export async function getReadinessHistory(days: number = 30): Promise<ReadinessMetric[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('readiness_metrics')
      .select('*')
      .eq('user_id', user.id)
      .gte('recorded_date', startDate.toISOString().split('T')[0])
      .order('recorded_date', { ascending: false })

    if (error) {
      console.error('Error fetching readiness history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getReadinessHistory:', error)
    return []
  }
}

export async function getLatestReadinessScore(): Promise<ReadinessMetric | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data, error } = await supabase
      .from('readiness_metrics')
      .select('*')
      .eq('user_id', user.id)
      .not('overall_readiness', 'is', null)
      .order('recorded_date', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching latest readiness score:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getLatestReadinessScore:', error)
    return null
  }
}

export async function createOrUpdateReadinessMetrics(metrics: Partial<ReadinessMetric>): Promise<ReadinessMetric | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Calculate readiness scores
    const calculatedMetrics = calculateReadinessScores(metrics)

    const { data, error } = await supabase
      .from('readiness_metrics')
      .upsert({
        user_id: user.id,
        recorded_date: metrics.recorded_date || new Date().toISOString().split('T')[0],
        ...metrics,
        ...calculatedMetrics,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving readiness metrics:', error)
      return null
    }

    revalidatePath('/readiness')
    revalidatePath('/dashboard')
    return data
  } catch (error) {
    console.error('Error in createOrUpdateReadinessMetrics:', error)
    return null
  }
}

// Readiness scoring algorithm
function calculateReadinessScores(metrics: Partial<ReadinessMetric>): Partial<ReadinessMetric> {
  const scores: Partial<ReadinessMetric> = {}

  // Recovery Score (45% weight) - HRV, RHR, Sleep
  let recoveryScore = 0
  let recoveryCount = 0

  if (metrics.hrv !== undefined) {
    // Higher HRV is better (normalize to 0-100, assuming 20-100ms range)
    const hrvScore = Math.min(Math.max((metrics.hrv - 20) / 80 * 100, 0), 100)
    recoveryScore += hrvScore
    recoveryCount++
  }

  if (metrics.resting_hr !== undefined) {
    // Lower RHR is better (normalize to 0-100, assuming 40-80bpm range)
    const rhrScore = Math.min(Math.max((80 - metrics.resting_hr) / 40 * 100, 0), 100)
    recoveryScore += rhrScore
    recoveryCount++
  }

  if (metrics.sleep_hours !== undefined) {
    // 7-9 hours is optimal
    let sleepHoursScore = 0
    if (metrics.sleep_hours >= 7 && metrics.sleep_hours <= 9) {
      sleepHoursScore = 100
    } else if (metrics.sleep_hours >= 6 && metrics.sleep_hours < 7) {
      sleepHoursScore = 75
    } else if (metrics.sleep_hours > 9 && metrics.sleep_hours <= 10) {
      sleepHoursScore = 75
    } else if (metrics.sleep_hours >= 5 && metrics.sleep_hours < 6) {
      sleepHoursScore = 50
    } else if (metrics.sleep_hours > 10 && metrics.sleep_hours <= 12) {
      sleepHoursScore = 50
    } else {
      sleepHoursScore = 25
    }
    recoveryScore += sleepHoursScore
    recoveryCount++
  }

  if (metrics.sleep_quality !== undefined) {
    // Sleep quality is already 0-100
    recoveryScore += metrics.sleep_quality
    recoveryCount++
  }

  scores.recovery_score = recoveryCount > 0 ? recoveryScore / recoveryCount : undefined

  // Wellness Score (20% weight) - Fatigue, Soreness, Mood, Stress
  let wellnessScore = 0
  let wellnessCount = 0

  if (metrics.fatigue !== undefined) {
    // Convert 1-5 scale to 0-100 (5 = very energetic = 100, 1 = very tired = 20)
    const fatigueScore = ((metrics.fatigue - 1) / 4) * 100
    wellnessScore += fatigueScore
    wellnessCount++
  }

  if (metrics.soreness !== undefined) {
    // Convert 1-5 scale to 0-100 (1 = no soreness = 100, 5 = severe = 20)
    const sorenessScore = ((6 - metrics.soreness) / 4) * 100
    wellnessScore += sorenessScore
    wellnessCount++
  }

  if (metrics.mood !== undefined) {
    // Convert 1-5 scale to 0-100 (5 = excellent = 100, 1 = very bad = 20)
    const moodScore = ((metrics.mood - 1) / 4) * 100
    wellnessScore += moodScore
    wellnessCount++
  }

  if (metrics.stress !== undefined) {
    // Convert 1-5 scale to 0-100 (1 = no stress = 100, 5 = extreme = 20)
    const stressScore = ((6 - metrics.stress) / 4) * 100
    wellnessScore += stressScore
    wellnessCount++
  }

  scores.wellness_score = wellnessCount > 0 ? wellnessScore / wellnessCount : undefined

  // Fueling Score (10% weight) - Energy balance, Hydration
  let fuelingScore = 0
  let fuelingCount = 0

  if (metrics.energy_intake !== undefined && metrics.energy_burn !== undefined) {
    // Energy balance: aim for slight surplus/deficit
    const balance = metrics.energy_intake - metrics.energy_burn
    let balanceScore = 0
    if (Math.abs(balance) <= 200) { // Within 200kcal is good
      balanceScore = 100
    } else if (Math.abs(balance) <= 500) {
      balanceScore = 75
    } else if (Math.abs(balance) <= 1000) {
      balanceScore = 50
    } else {
      balanceScore = 25
    }
    fuelingScore += balanceScore
    fuelingCount++
  }

  if (metrics.hydration_ml !== undefined) {
    // 2000-4000ml is good range
    let hydrationScore = 0
    if (metrics.hydration_ml >= 2000 && metrics.hydration_ml <= 4000) {
      hydrationScore = 100
    } else if (metrics.hydration_ml >= 1500 && metrics.hydration_ml < 2000) {
      hydrationScore = 75
    } else if (metrics.hydration_ml > 4000 && metrics.hydration_ml <= 5000) {
      hydrationScore = 75
    } else if (metrics.hydration_ml >= 1000 && metrics.hydration_ml < 1500) {
      hydrationScore = 50
    } else {
      hydrationScore = 25
    }
    fuelingScore += hydrationScore
    fuelingCount++
  }

  scores.fueling_score = fuelingCount > 0 ? fuelingScore / fuelingCount : undefined

  // Load Score (20% weight) - Training load ratios
  let loadScore = 100 // Default to 100 if no load data
  let loadCount = 0

  if (metrics.acute_load !== undefined && metrics.chronic_load !== undefined && metrics.chronic_load > 0) {
    // Acute:Chronic ratio - 0.8-1.3 is optimal
    const acRatio = metrics.acute_load / metrics.chronic_load
    if (acRatio >= 0.8 && acRatio <= 1.3) {
      loadScore = 100
    } else if (acRatio >= 0.6 && acRatio < 0.8) {
      loadScore = 75
    } else if (acRatio > 1.3 && acRatio <= 1.5) {
      loadScore = 75
    } else if (acRatio >= 0.4 && acRatio < 0.6) {
      loadScore = 50
    } else if (acRatio > 1.5 && acRatio <= 2.0) {
      loadScore = 50
    } else {
      loadScore = 25
    }
    loadCount++
  }

  scores.load_score = loadCount > 0 ? loadScore : undefined

  // Context Score (5% weight) - Environmental factors
  let contextScore = 100 // Default to 100
  let contextCount = 0

  if (metrics.illness) {
    contextScore -= 30
    contextCount++
  }

  if (metrics.travel) {
    contextScore -= 20
    contextCount++
  }

  if (metrics.temperature !== undefined) {
    // Extreme temperatures affect performance
    if (metrics.temperature < 5 || metrics.temperature > 30) {
      contextScore -= 15
      contextCount++
    }
  }

  if (metrics.altitude !== undefined && metrics.altitude > 2000) {
    // High altitude affects performance
    contextScore -= Math.min(metrics.altitude / 100, 20)
    contextCount++
  }

  scores.context_score = Math.max(contextScore, 0)

  // Overall Readiness Score - Weighted average
  const weights = {
    recovery: 0.45,
    wellness: 0.20,
    load: 0.20,
    fueling: 0.10,
    context: 0.05
  }

  let totalScore = 0
  let totalWeight = 0

  if (scores.recovery_score !== undefined) {
    totalScore += scores.recovery_score * weights.recovery
    totalWeight += weights.recovery
  }

  if (scores.wellness_score !== undefined) {
    totalScore += scores.wellness_score * weights.wellness
    totalWeight += weights.wellness
  }

  if (scores.load_score !== undefined) {
    totalScore += scores.load_score * weights.load
    totalWeight += weights.load
  }

  if (scores.fueling_score !== undefined) {
    totalScore += scores.fueling_score * weights.fueling
    totalWeight += weights.fueling
  }

  if (scores.context_score !== undefined) {
    totalScore += scores.context_score * weights.context
    totalWeight += weights.context
  }

  scores.overall_readiness = totalWeight > 0 ? Math.round(totalScore / totalWeight) : undefined

  return scores
}

// Equipment functions
export async function getEquipmentCategories(): Promise<EquipmentCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('equipment_categories')
    .select('*')
    .order('sport', { ascending: true })

  if (error) {
    console.error('Error fetching equipment categories:', error)
    return []
  }

  return data || []
}

export async function getUserEquipment(): Promise<Equipment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      category:equipment_categories(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user equipment:', error)
    return []
  }

  return data || []
}

export async function createEquipment(equipmentData: {
  equipment_name: string
  category_id?: string
  brand?: string
  model?: string
  purchase_date?: string
  purchase_price?: number
  notes?: string
}): Promise<{ success: boolean; equipment?: Equipment; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('equipment')
    .insert([equipmentData])
    .select(`
      *,
      category:equipment_categories(*)
    `)
    .single()

  if (error) {
    console.error('Error creating equipment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/equipment')
  return { success: true, equipment: data }
}

export async function updateEquipment(equipmentId: string, equipmentData: {
  equipment_name?: string
  category_id?: string
  brand?: string
  model?: string
  purchase_date?: string
  purchase_price?: number
  current_value?: number
  mileage_distance?: number
  mileage_time?: number
  notes?: string
  is_active?: boolean
}): Promise<{ success: boolean; equipment?: Equipment; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('equipment')
    .update(equipmentData)
    .eq('id', equipmentId)
    .select(`
      *,
      category:equipment_categories(*)
    `)
    .single()

  if (error) {
    console.error('Error updating equipment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/equipment')
  return { success: true, equipment: data }
}

export async function deleteEquipment(equipmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', equipmentId)

  if (error) {
    console.error('Error deleting equipment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/equipment')
  return { success: true }
}

// Sends functions
export async function getRecentSends(limit: number = 10): Promise<Send[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sends')
    .select('*')
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent sends:', error)
    return []
  }

  return data || []
}

export async function getSendsBySport(sport: string, limit: number = 20): Promise<Send[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sends')
    .select('*')
    .eq('sport', sport)
    .order('activity_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching sends by sport:', error)
    return []
  }

  return data || []
}

export async function createSend(sendData: {
  sport: string
  activity_date?: string
  duration_minutes?: number

  // Climbing specific
  climb_type?: string
  climb_name?: string
  climb_grade?: string
  climb_location?: string

  // MTB specific
  trail_name?: string
  trail_level?: string
  trail_time?: string
  trail_distance?: number

  // Skiing/Snowboarding specific
  mountain_name?: string
  vertical_feet?: number
  runs_completed?: number

  // Running specific
  run_distance?: number
  run_time?: string
  run_pace?: string
  run_elevation_gain?: number

  // Equipment used
  equipment_used?: string[]

  // General fields
  notes?: string
  rating?: number
  weather_conditions?: string
  partners?: string
}): Promise<{ success: boolean; send?: Send; error?: string }> {
  'use server'
  
  const supabase = await createClient()
  
  // Get the current user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError || !session?.user) {
    console.error('Session error:', sessionError)
    return { success: false, error: 'User not authenticated' }
  }

  const user = session.user
  console.log('Creating send for user:', user.id)
  console.log('Send data:', { ...sendData, user_id: user.id })

  const { data, error } = await supabase
    .from('sends')
    .insert([{
      ...sendData,
      user_id: user.id
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating send:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/training')
  return { success: true, send: data }
}

export async function logSend(formData: FormData) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    const sport = formData.get('sport') as string
    const activity_date = formData.get('activity_date') as string || new Date().toISOString().split('T')[0]
    const duration_minutes = formData.get('duration_minutes') ? parseInt(formData.get('duration_minutes') as string) : null
    const notes = formData.get('notes') as string
    const rating = formData.get('rating') ? parseInt(formData.get('rating') as string) : null
    const weather_conditions = formData.get('weather_conditions') as string
    const partners = formData.get('partners') as string

    // Sport-specific fields
    const climb_type = formData.get('climb_type') as string
    const climb_name = formData.get('climb_name') as string
    const climb_grade = formData.get('climb_grade') as string
    const climb_location = formData.get('climb_location') as string

    const trail_name = formData.get('trail_name') as string
    const trail_level = formData.get('trail_level') as string
    const trail_time = formData.get('trail_time') as string
    const trail_distance = formData.get('trail_distance') ? parseFloat(formData.get('trail_distance') as string) : null

    const mountain_name = formData.get('mountain_name') as string
    const vertical_feet = formData.get('vertical_feet') ? parseInt(formData.get('vertical_feet') as string) : null
    const runs_completed = formData.get('runs_completed') ? parseInt(formData.get('runs_completed') as string) : null

    const run_distance = formData.get('run_distance') ? parseFloat(formData.get('run_distance') as string) : null
    const run_time = formData.get('run_time') as string
    const run_pace = formData.get('run_pace') as string
    const run_elevation_gain = formData.get('run_elevation_gain') ? parseInt(formData.get('run_elevation_gain') as string) : null

    // Equipment used - this would need to be handled differently for form data
    // For now, we'll skip equipment and handle it in the client-side version
    const equipment_used: string[] = []

    const { data, error } = await supabase
      .from('sends')
      .insert({
        user_id: user.id,
        sport,
        activity_date,
        duration_minutes,
        notes,
        rating,
        weather_conditions,
        partners,
        climb_type,
        climb_name,
        climb_grade,
        climb_location,
        trail_name,
        trail_level,
        trail_time,
        trail_distance,
        mountain_name,
        vertical_feet,
        runs_completed,
        run_distance,
        run_time,
        run_pace,
        run_elevation_gain,
        equipment_used
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging send:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/training')
    return { success: true, data }
  } catch (error) {
    console.error('Error in logSend:', error)
    return { success: false, error: 'Failed to log activity' }
  }
}

export async function updateSend(sendId: string, sendData: {
  sport?: string
  activity_date?: string
  duration_minutes?: number

  // Climbing specific
  climb_type?: string
  climb_name?: string
  climb_grade?: string
  climb_location?: string

  // MTB specific
  trail_name?: string
  trail_level?: string
  trail_time?: string
  trail_distance?: number

  // Skiing/Snowboarding specific
  mountain_name?: string
  vertical_feet?: number
  runs_completed?: number

  // Running specific
  run_distance?: number
  run_time?: string
  run_pace?: string
  run_elevation_gain?: number

  // Equipment used
  equipment_used?: string[]

  // General fields
  notes?: string
  rating?: number
  weather_conditions?: string
  partners?: string
}): Promise<{ success: boolean; send?: Send; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sends')
    .update(sendData)
    .eq('id', sendId)
    .select()
    .single()

  if (error) {
    console.error('Error updating send:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/training')
  return { success: true, send: data }
}

export async function deleteSend(sendId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sends')
    .delete()
    .eq('id', sendId)

  if (error) {
    console.error('Error deleting send:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/training')
  return { success: true }
}

export async function getSendStats(): Promise<{
  totalSends: number
  sendsBySport: { sport: string; count: number }[]
  recentActivity: { date: string; count: number }[]
}> {
  const supabase = await createClient()

  // Get total sends
  const { count: totalSends } = await supabase
    .from('sends')
    .select('*', { count: 'exact', head: true })

  // Get sends by sport
  const { data: rawSportData } = await supabase
    .from('sends')
    .select('sport')

  const sportCounts: { [key: string]: number } = {}
  rawSportData?.forEach(send => {
    sportCounts[send.sport] = (sportCounts[send.sport] || 0) + 1
  })
  const sendsBySport = Object.entries(sportCounts).map(([sport, count]) => ({ sport, count }))

  // Get recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const { data: rawRecentData } = await supabase
    .from('sends')
    .select('activity_date')
    .gte('activity_date', thirtyDaysAgo)

  const dateCounts: { [key: string]: number } = {}
  rawRecentData?.forEach(send => {
    dateCounts[send.activity_date] = (dateCounts[send.activity_date] || 0) + 1
  })
  const recentActivity = Object.entries(dateCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    totalSends: totalSends || 0,
    sendsBySport: sendsBySport || [],
    recentActivity: recentActivity || []
  }
}

// Chart Data Functions
export async function getNutritionTrends(days: number = 30): Promise<Array<{
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}>> {
  try {
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const { data: meals, error } = await supabase
      .from('meals')
      .select('meal_date, total_calories, total_protein, total_carbs, total_fat, total_fiber')
      .gte('meal_date', startDate.toISOString().split('T')[0])
      .lte('meal_date', endDate.toISOString().split('T')[0])
      .order('meal_date')

    if (error) {
      console.error('Error fetching nutrition trends:', error)
      return []
    }

    // Group by date and sum values
    const dateMap = new Map<string, {
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber: number
    }>()

    meals?.forEach(meal => {
      const date = meal.meal_date
      const existing = dateMap.get(date) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

      dateMap.set(date, {
        calories: existing.calories + (meal.total_calories || 0),
        protein: existing.protein + (meal.total_protein || 0),
        carbs: existing.carbs + (meal.total_carbs || 0),
        fat: existing.fat + (meal.total_fat || 0),
        fiber: existing.fiber + (meal.total_fiber || 0)
      })
    })

    // Convert to array and fill missing dates
    const result: Array<{
      date: string
      calories: number
      protein: number
      carbs: number
      fat: number
      fiber: number
    }> = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const data = dateMap.get(dateStr) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      result.push({
        date: dateStr,
        ...data
      })
    }

    return result
  } catch (error) {
    console.error('Error in getNutritionTrends:', error)
    return []
  }
}

export async function getWorkoutTrends(days: number = 30): Promise<Array<{
  date: string
  workouts: number
  totalMinutes: number
  totalCalories: number
}>> {
  try {
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('workout_date, duration_minutes, calories_burned')
      .gte('workout_date', startDate.toISOString().split('T')[0])
      .lte('workout_date', endDate.toISOString().split('T')[0])
      .order('workout_date')

    if (error) {
      console.error('Error fetching workout trends:', error)
      return []
    }

    // Group by date
    const dateMap = new Map<string, {
      workouts: number
      totalMinutes: number
      totalCalories: number
    }>()

    workouts?.forEach(workout => {
      const date = workout.workout_date
      const existing = dateMap.get(date) || { workouts: 0, totalMinutes: 0, totalCalories: 0 }

      dateMap.set(date, {
        workouts: existing.workouts + 1,
        totalMinutes: existing.totalMinutes + (workout.duration_minutes || 0),
        totalCalories: existing.totalCalories + (workout.calories_burned || 0)
      })
    })

    // Convert to array and fill missing dates
    const result: Array<{
      date: string
      workouts: number
      totalMinutes: number
      totalCalories: number
    }> = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const data = dateMap.get(dateStr) || { workouts: 0, totalMinutes: 0, totalCalories: 0 }
      result.push({
        date: dateStr,
        ...data
      })
    }

    return result
  } catch (error) {
    console.error('Error in getWorkoutTrends:', error)
    return []
  }
}

export async function getHealthMetricsTrends(days: number = 30): Promise<Array<{
  date: string
  weight?: number
  bodyFat?: number
  restingHR?: number
  sleepQuality?: number
}>> {
  try {
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    const { data: metrics, error } = await supabase
      .from('health_metrics')
      .select('recorded_date, metric_type, value')
      .gte('recorded_date', startDate.toISOString().split('T')[0])
      .lte('recorded_date', endDate.toISOString().split('T')[0])
      .order('recorded_date')

    if (error) {
      console.error('Error fetching health metrics trends:', error)
      return []
    }

    // Group by date
    const dateMap = new Map<string, {
      weight?: number
      bodyFat?: number
      restingHR?: number
      sleepQuality?: number
    }>()

    metrics?.forEach(metric => {
      const date = metric.recorded_date
      const existing = dateMap.get(date) || {}

      switch (metric.metric_type) {
        case 'weight':
          existing.weight = metric.value
          break
        case 'body_fat':
          existing.bodyFat = metric.value
          break
        case 'resting_hr':
          existing.restingHR = metric.value
          break
        case 'sleep_quality':
          existing.sleepQuality = metric.value
          break
      }

      dateMap.set(date, existing)
    })

    // Convert to array and fill missing dates
    const result: Array<{
      date: string
      weight?: number
      bodyFat?: number
      restingHR?: number
      sleepQuality?: number
    }> = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const data = dateMap.get(dateStr) || {}
      result.push({
        date: dateStr,
        ...data
      })
    }

    return result
  } catch (error) {
    console.error('Error in getHealthMetricsTrends:', error)
    return []
  }
}

export async function getHydrationCaffeineTrends(days: number = 30): Promise<Array<{
  date: string
  hydration: number
  caffeine: number
}>> {
  try {
    const supabase = await createClient()

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get hydration data
    const { data: hydrationData, error: hydrationError } = await supabase
      .from('hydration_logs')
      .select('logged_time, amount_ml')
      .gte('logged_time', startDate.toISOString())
      .lte('logged_time', endDate.toISOString())

    // Get caffeine data
    const { data: caffeineData, error: caffeineError } = await supabase
      .from('caffeine_logs')
      .select('logged_time, amount_mg')
      .gte('logged_time', startDate.toISOString())
      .lte('logged_time', endDate.toISOString())

    if (hydrationError) {
      console.error('Error fetching hydration trends:', hydrationError)
    }
    if (caffeineError) {
      console.error('Error fetching caffeine trends:', caffeineError)
    }

    // Group by date
    const dateMap = new Map<string, { hydration: number, caffeine: number }>()

    // Process hydration data
    hydrationData?.forEach(log => {
      const date = log.logged_time.split('T')[0]
      const existing = dateMap.get(date) || { hydration: 0, caffeine: 0 }
      existing.hydration += log.amount_ml || 0
      dateMap.set(date, existing)
    })

    // Process caffeine data
    caffeineData?.forEach(log => {
      const date = log.logged_time.split('T')[0]
      const existing = dateMap.get(date) || { hydration: 0, caffeine: 0 }
      existing.caffeine += log.amount_mg || 0
      dateMap.set(date, existing)
    })

    // Convert to array and fill missing dates
    const result: Array<{
      date: string
      hydration: number
      caffeine: number
    }> = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const data = dateMap.get(dateStr) || { hydration: 0, caffeine: 0 }
      result.push({
        date: dateStr,
        ...data
      })
    }

    return result
  } catch (error) {
    console.error('Error in getHydrationCaffeineTrends:', error)
    return []
  }
}

// AI Insights and Recommendations
export interface Insight {
  id: string
  type: 'workout' | 'nutrition' | 'health' | 'goals' | 'hydration' | 'general'
  priority: 'low' | 'medium' | 'high'
  title: string
  message: string
  recommendation?: string
  data?: any
  created_at: string
}

export async function generateWorkoutInsights(): Promise<Insight[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const insights: Insight[] = []

    // Get recent workout data
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .limit(30)

    if (!workouts || workouts.length === 0) {
      insights.push({
        id: 'workout-start',
        type: 'workout',
        priority: 'high',
        title: 'Start Your Fitness Journey',
        message: 'You haven\'t logged any workouts yet. Getting started is the hardest part!',
        recommendation: 'Try logging your first workout today - even a 20-minute walk counts!',
        created_at: new Date().toISOString()
      })
      return insights
    }

    // Analyze workout frequency
    const lastWeek = workouts.filter(w => {
      const workoutDate = new Date(w.workout_date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return workoutDate >= weekAgo
    })

    if (lastWeek.length === 0) {
      insights.push({
        id: 'workout-streak-broken',
        type: 'workout',
        priority: 'medium',
        title: 'Time to Get Back At It',
        message: 'You haven\'t worked out in the last week. Consistency is key!',
        recommendation: 'Schedule your next workout for tomorrow and build back your routine.',
        created_at: new Date().toISOString()
      })
    } else if (lastWeek.length >= 5) {
      insights.push({
        id: 'workout-consistent',
        type: 'workout',
        priority: 'low',
        title: 'Great Consistency!',
        message: `You've completed ${lastWeek.length} workouts this week. Keep it up!`,
        recommendation: 'Consider adding variety to prevent burnout - try a new activity type.',
        created_at: new Date().toISOString()
      })
    }

    // Analyze workout intensity
    const highIntensityCount = workouts.filter(w => w.intensity === 'High').length
    const totalWorkouts = workouts.length
    const highIntensityPercentage = (highIntensityCount / totalWorkouts) * 100

    if (highIntensityPercentage > 70) {
      insights.push({
        id: 'workout-intensity-high',
        type: 'workout',
        priority: 'medium',
        title: 'High Intensity Alert',
        message: `${Math.round(highIntensityPercentage)}% of your workouts are high intensity.`,
        recommendation: 'Mix in some moderate or low-intensity workouts to allow for recovery and prevent injury.',
        created_at: new Date().toISOString()
      })
    }

    return insights
  } catch (error) {
    console.error('Error generating workout insights:', error)
    return []
  }
}

export async function generateNutritionInsights(): Promise<Insight[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const insights: Insight[] = []

    // Get recent meal data
    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .order('meal_date', { ascending: false })
      .limit(30)

    if (!meals || meals.length === 0) {
      insights.push({
        id: 'nutrition-start',
        type: 'nutrition',
        priority: 'high',
        title: 'Track Your Nutrition',
        message: 'Start logging your meals to understand your eating patterns and optimize your performance.',
        recommendation: 'Log your next meal and see how it affects your energy levels throughout the day.',
        created_at: new Date().toISOString()
      })
      return insights
    }

    // Analyze calorie consistency
    const recentMeals = meals.slice(0, 7) // Last 7 meals
    const avgCalories = recentMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / recentMeals.length
    const calorieVariance = recentMeals.reduce((sum, meal) => {
      const diff = (meal.total_calories || 0) - avgCalories
      return sum + (diff * diff)
    }, 0) / recentMeals.length
    const stdDev = Math.sqrt(calorieVariance)

    if (stdDev > avgCalories * 0.3) { // High variance (>30% of average)
      insights.push({
        id: 'nutrition-calories-inconsistent',
        type: 'nutrition',
        priority: 'medium',
        title: 'Calorie Intake Varies Widely',
        message: 'Your daily calorie intake fluctuates significantly, which can affect energy levels.',
        recommendation: 'Aim for more consistent calorie intake throughout the week for better performance.',
        data: { avgCalories: Math.round(avgCalories), stdDev: Math.round(stdDev) },
        created_at: new Date().toISOString()
      })
    }

    // Analyze protein intake
    const avgProtein = recentMeals.reduce((sum, meal) => sum + (meal.total_protein || 0), 0) / recentMeals.length
    if (avgProtein < 80) { // Less than recommended minimum
      insights.push({
        id: 'nutrition-low-protein',
        type: 'nutrition',
        priority: 'high',
        title: 'Boost Your Protein Intake',
        message: `Your average protein intake is ${Math.round(avgProtein)}g per meal.`,
        recommendation: 'Include protein-rich foods like chicken, fish, eggs, or plant-based alternatives in every meal.',
        data: { avgProtein: Math.round(avgProtein) },
        created_at: new Date().toISOString()
      })
    }

    return insights
  } catch (error) {
    console.error('Error generating nutrition insights:', error)
    return []
  }
}

export async function generateHealthInsights(): Promise<Insight[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const insights: Insight[] = []

    // Get recent health metrics
    const { data: metrics } = await supabase
      .from('health_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_date', { ascending: false })
      .limit(30)

    if (!metrics || metrics.length === 0) {
      insights.push({
        id: 'health-start-tracking',
        type: 'health',
        priority: 'medium',
        title: 'Track Your Health Metrics',
        message: 'Start monitoring key health indicators to optimize your performance and recovery.',
        recommendation: 'Log your weight, body fat percentage, or resting heart rate to see trends over time.',
        created_at: new Date().toISOString()
      })
      return insights
    }

    // Analyze weight trends
    const weightMetrics = metrics.filter(m => m.metric_type === 'weight')
    if (weightMetrics.length >= 7) {
      const recentWeights = weightMetrics.slice(0, 7)
      const oldestWeight = recentWeights[recentWeights.length - 1].value
      const newestWeight = recentWeights[0].value
      const weightChange = newestWeight - oldestWeight

      if (Math.abs(weightChange) > 2) { // Significant change
        const direction = weightChange > 0 ? 'gained' : 'lost'
        insights.push({
          id: 'health-weight-change',
          type: 'health',
          priority: 'medium',
          title: `Weight ${direction.charAt(0).toUpperCase() + direction.slice(1)}`,
          message: `You've ${direction} ${Math.abs(Math.round(weightChange * 10) / 10)}kg in the last week.`,
          recommendation: weightChange > 0
            ? 'Monitor your calorie intake and consider increasing activity levels if this wasn\'t intentional.'
            : 'Ensure you\'re getting enough nutrients and not losing weight too quickly.',
          data: { weightChange: Math.round(weightChange * 10) / 10 },
          created_at: new Date().toISOString()
        })
      }
    }

    return insights
  } catch (error) {
    console.error('Error generating health insights:', error)
    return []
  }
}

export async function generateGoalInsights(): Promise<Insight[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const insights: Insight[] = []

    // Get active goals
    const { data: goals } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!goals || goals.length === 0) {
      insights.push({
        id: 'goals-set-first',
        type: 'goals',
        priority: 'high',
        title: 'Set Your First Goal',
        message: 'Goals help you stay motivated and track your progress toward specific targets.',
        recommendation: 'Set a realistic goal like "Workout 3 times per week" or "Lose 1kg per month".',
        created_at: new Date().toISOString()
      })
      return insights
    }

    // Analyze goal progress
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: (goal.current_value / goal.target_value) * 100
    }))

    const completedGoals = goalsWithProgress.filter(g => g.progress >= 100)
    const strugglingGoals = goalsWithProgress.filter(g => g.progress < 30)

    if (completedGoals.length > 0) {
      insights.push({
        id: 'goals-completed',
        type: 'goals',
        priority: 'low',
        title: 'Goals Achieved! 🎉',
        message: `Congratulations! You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''}.`,
        recommendation: 'Set new, challenging goals to keep progressing.',
        data: { completedCount: completedGoals.length },
        created_at: new Date().toISOString()
      })
    }

    if (strugglingGoals.length > 0) {
      insights.push({
        id: 'goals-struggling',
        type: 'goals',
        priority: 'high',
        title: 'Goals Need Attention',
        message: `${strugglingGoals.length} of your goals have less than 30% progress.`,
        recommendation: 'Break down large goals into smaller milestones or adjust your target timeline.',
        data: { strugglingCount: strugglingGoals.length },
        created_at: new Date().toISOString()
      })
    }

    return insights
  } catch (error) {
    console.error('Error generating goal insights:', error)
    return []
  }
}

export async function generateHydrationInsights(): Promise<Insight[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const insights: Insight[] = []

    // Get recent hydration data
    const { data: hydration } = await supabase
      .from('hydration')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    if (!hydration || hydration.length === 0) {
      insights.push({
        id: 'hydration-start',
        type: 'hydration',
        priority: 'medium',
        title: 'Stay Hydrated',
        message: 'Proper hydration is crucial for performance and recovery.',
        recommendation: 'Aim for 2500-3000ml of water per day. Start tracking your intake!',
        created_at: new Date().toISOString()
      })
      return insights
    }

    // Analyze hydration consistency
    const avgHydration = hydration.reduce((sum, h) => sum + h.amount_ml, 0) / hydration.length
    const lowHydrationDays = hydration.filter(h => h.amount_ml < 2000).length

    if (avgHydration < 2000) {
      insights.push({
        id: 'hydration-low-average',
        type: 'hydration',
        priority: 'high',
        title: 'Increase Your Water Intake',
        message: `Your average daily hydration is ${Math.round(avgHydration)}ml.`,
        recommendation: 'Set reminders to drink water throughout the day and carry a reusable water bottle.',
        data: { avgHydration: Math.round(avgHydration) },
        created_at: new Date().toISOString()
      })
    }

    if (lowHydrationDays > 3) {
      insights.push({
        id: 'hydration-inconsistent',
        type: 'hydration',
        priority: 'medium',
        title: 'Inconsistent Hydration',
        message: `${lowHydrationDays} out of the last 7 days had low hydration (<2000ml).`,
        recommendation: 'Create a hydration routine - drink a glass of water with each meal and between workouts.',
        data: { lowHydrationDays },
        created_at: new Date().toISOString()
      })
    }

    return insights
  } catch (error) {
    console.error('Error generating hydration insights:', error)
    return []
  }
}

export async function getAllInsights(): Promise<Insight[]> {
  try {
    const [workoutInsights, nutritionInsights, healthInsights, goalInsights, hydrationInsights] = await Promise.all([
      generateWorkoutInsights(),
      generateNutritionInsights(),
      generateHealthInsights(),
      generateGoalInsights(),
      generateHydrationInsights()
    ])

    const allInsights = [
      ...workoutInsights,
      ...nutritionInsights,
      ...healthInsights,
      ...goalInsights,
      ...hydrationInsights
    ]

    // Sort by priority (high -> medium -> low) and then by creation time
    return allInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } catch (error) {
    console.error('Error getting all insights:', error)
    return []
  }
}

// Advanced AI Analytics and Predictions
export interface PerformancePrediction {
  predicted_performance: number
  confidence_level: number
  trend_direction: 'improving' | 'declining' | 'stable'
  factors_influencing: string[]
  next_workout_suggestion: string
  estimated_date?: string
}

export interface TrainingOptimization {
  optimal_training_time: string
  recommended_intensity: 'Low' | 'Medium' | 'High'
  training_load_score: number
  recovery_days_needed: number
  next_session_focus: string
  risk_factors: string[]
}

export async function predictWorkoutPerformance(): Promise<PerformancePrediction | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get recent workout data (last 10 workouts)
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .limit(10)

    if (!workouts || workouts.length < 3) {
      return null // Need at least 3 workouts for prediction
    }

    // Simple linear regression for performance prediction
    const workoutData = workouts.reverse() // Oldest first for trend analysis
    const performanceScores = workoutData.map((workout, index) => ({
      x: index, // Time index
      y: (workout.duration_minutes || 0) * (workout.intensity === 'High' ? 1.5 : workout.intensity === 'Medium' ? 1.2 : 1.0)
    }))

    // Calculate trend using simple linear regression
    const n = performanceScores.length
    const sumX = performanceScores.reduce((sum, point) => sum + point.x, 0)
    const sumY = performanceScores.reduce((sum, point) => sum + point.y, 0)
    const sumXY = performanceScores.reduce((sum, point) => sum + point.x * point.y, 0)
    const sumXX = performanceScores.reduce((sum, point) => sum + point.x * point.x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Predict next performance (at x = n)
    const predictedPerformance = slope * n + intercept
    const currentPerformance = performanceScores[performanceScores.length - 1].y
    const trendDirection = slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable'

    // Calculate confidence based on data consistency
    const variances = performanceScores.map(point => Math.pow(point.y - (slope * point.x + intercept), 2))
    const mse = variances.reduce((sum, variance) => sum + variance, 0) / n
    const confidenceLevel = Math.max(0, Math.min(100, 100 - (mse / currentPerformance) * 50))

    // Determine influencing factors
    const factors = []
    const recentWorkouts = workoutData.slice(-3)
    const avgIntensity = recentWorkouts.reduce((sum, w) => sum + (w.intensity === 'High' ? 3 : w.intensity === 'Medium' ? 2 : 1), 0) / recentWorkouts.length

    if (avgIntensity > 2.5) factors.push('High training intensity')
    if (recentWorkouts.length >= 3 && recentWorkouts.every(w => new Date(w.workout_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) {
      factors.push('Consistent training schedule')
    }
    if (slope > 1) factors.push('Progressive overload')
    if (slope < -1) factors.push('Possible overtraining or recovery needs')

    // Generate next workout suggestion
    let suggestion = 'Maintain current training intensity'
    if (trendDirection === 'improving') {
      suggestion = 'Consider increasing training volume or intensity'
    } else if (trendDirection === 'declining') {
      suggestion = 'Focus on recovery and consider reducing intensity'
    }

    return {
      predicted_performance: Math.round(predictedPerformance * 10) / 10,
      confidence_level: Math.round(confidenceLevel),
      trend_direction: trendDirection,
      factors_influencing: factors,
      next_workout_suggestion: suggestion
    }
  } catch (error) {
    console.error('Error predicting workout performance:', error)
    return null
  }
}

export async function optimizeTrainingSchedule(): Promise<TrainingOptimization | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get recent workout data
    const { data: workouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })
      .limit(14) // Last 2 weeks

    if (!workouts || workouts.length < 3) {
      return null
    }

    // Analyze training patterns
    const workoutTimes = workouts.map(w => new Date(w.workout_date).getHours())
    const avgWorkoutTime = workoutTimes.reduce((sum, time) => sum + time, 0) / workoutTimes.length

    // Determine optimal training time based on consistency and performance
    let optimalTime = '18:00' // Default evening
    if (avgWorkoutTime < 12) {
      optimalTime = '08:00' // Morning person
    } else if (avgWorkoutTime < 17) {
      optimalTime = '12:00' // Midday
    }

    // Calculate training load score (0-100)
    const recentWorkouts = workouts.slice(0, 7) // Last week
    const totalMinutes = recentWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0)
    const highIntensityCount = recentWorkouts.filter(w => w.intensity === 'High').length
    const trainingLoadScore = Math.min(100, (totalMinutes / 300) * 50 + (highIntensityCount / 7) * 50)

    // Determine recommended intensity
    let recommendedIntensity: 'Low' | 'Medium' | 'High' = 'Medium'
    if (trainingLoadScore > 80) {
      recommendedIntensity = 'Low' // Overloaded, need recovery
    } else if (trainingLoadScore < 30) {
      recommendedIntensity = 'High' // Undertrained, can push harder
    }

    // Calculate recovery days needed
    let recoveryDays = 1
    if (trainingLoadScore > 70) {
      recoveryDays = 2
    } else if (trainingLoadScore < 40) {
      recoveryDays = 0
    }

    // Determine next session focus
    let nextFocus = 'Balanced training session'
    if (recommendedIntensity === 'Low') {
      nextFocus = 'Recovery and technique work'
    } else if (recommendedIntensity === 'High') {
      nextFocus = 'Progressive overload and strength building'
    }

    // Identify risk factors
    const riskFactors = []
    if (trainingLoadScore > 90) {
      riskFactors.push('High risk of overtraining')
    }
    if (recentWorkouts.length < 3) {
      riskFactors.push('Inconsistent training schedule')
    }
    const highIntensityRatio = highIntensityCount / recentWorkouts.length
    if (highIntensityRatio > 0.7) {
      riskFactors.push('Excessive high-intensity training')
    }

    return {
      optimal_training_time: optimalTime,
      recommended_intensity: recommendedIntensity,
      training_load_score: Math.round(trainingLoadScore),
      recovery_days_needed: recoveryDays,
      next_session_focus: nextFocus,
      risk_factors: riskFactors
    }
  } catch (error) {
    console.error('Error optimizing training schedule:', error)
    return null
  }
}

export async function predictGoalAchievement(goalId: string): Promise<{
  estimated_completion_date: string
  confidence_percentage: number
  required_weekly_progress: number
  current_trajectory: 'on_track' | 'behind' | 'ahead'
  recommendations: string[]
} | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get goal data
    const { data: goal } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (!goal) return null

    const currentProgress = (goal.current_value / goal.target_value) * 100
    const daysElapsed = Math.max(1, Math.floor((Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)))
    const targetDate = goal.target_date ? new Date(goal.target_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    const daysRemaining = Math.max(1, Math.floor((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    // Calculate required weekly progress
    const remainingProgress = 100 - currentProgress
    const requiredWeeklyProgress = (remainingProgress / daysRemaining) * 7

    // Determine trajectory
    let trajectory: 'on_track' | 'behind' | 'ahead' = 'on_track'
    const expectedProgress = (daysElapsed / (daysElapsed + daysRemaining)) * 100
    if (currentProgress < expectedProgress * 0.8) {
      trajectory = 'behind'
    } else if (currentProgress > expectedProgress * 1.2) {
      trajectory = 'ahead'
    }

    // Calculate confidence and estimated completion
    const weeklyProgressRate = currentProgress / Math.max(1, daysElapsed / 7)
    const estimatedWeeksToComplete = remainingProgress / Math.max(0.1, weeklyProgressRate)
    const estimatedCompletionDate = new Date(Date.now() + estimatedWeeksToComplete * 7 * 24 * 60 * 60 * 1000)

    // Confidence based on consistency (simplified)
    const confidencePercentage = Math.min(95, Math.max(10, weeklyProgressRate * 10))

    // Generate recommendations
    const recommendations = []
    if (trajectory === 'behind') {
      recommendations.push('Increase training frequency or intensity')
      recommendations.push('Consider adjusting your target timeline')
    } else if (trajectory === 'ahead') {
      recommendations.push('Consider increasing your target for greater challenge')
      recommendations.push('Maintain current progress rate')
    } else {
      recommendations.push('Keep up the excellent progress!')
    }

    return {
      estimated_completion_date: estimatedCompletionDate.toISOString().split('T')[0],
      confidence_percentage: Math.round(confidencePercentage),
      required_weekly_progress: Math.round(requiredWeeklyProgress * 10) / 10,
      current_trajectory: trajectory,
      recommendations
    }
  } catch (error) {
    console.error('Error predicting goal achievement:', error)
    return null
  }
}

// ===========================================
// STRENGTH TRAINING FUNCTIONS
// ===========================================

// Exercise Management
export async function getExercises(filters?: {
  category?: string
  muscle_groups?: string[]
  equipment?: string[]
  difficulty?: string
  search?: string
}): Promise<Exercise[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('exercises')
      .select('*')
      .order('name')

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    if (filters?.muscle_groups && filters.muscle_groups.length > 0) {
      query = query.overlaps('muscle_groups', filters.muscle_groups)
    }
    if (filters?.equipment && filters.equipment.length > 0) {
      query = query.overlaps('equipment', filters.equipment)
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return []
  }
}

export async function createExercise(exercise: Omit<Exercise, 'id' | 'created_at'>): Promise<Exercise | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        ...exercise,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/training')
    return data
  } catch (error) {
    console.error('Error creating exercise:', error)
    return null
  }
}

// Training Plan Management
export async function getTrainingPlans(filters?: {
  category?: string
  difficulty?: string
  is_public?: boolean
  created_by?: string
}): Promise<TrainingPlan[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('training_plans')
      .select(`
        *,
        training_phases (
          *,
          training_weeks (
            *,
            training_days (
              *,
              training_day_exercises (
                *,
                exercises (*)
              )
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    if (filters?.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public)
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching training plans:', error)
    return []
  }
}

export async function createTrainingPlan(plan: Omit<TrainingPlan, 'id' | 'created_at' | 'created_by'>): Promise<TrainingPlan | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Start a transaction-like approach (Supabase doesn't have explicit transactions in client)
    // First, create the main training plan
    const { data: planData, error: planError } = await supabase
      .from('training_plans')
      .insert({
        name: plan.name,
        description: plan.description,
        category: plan.category,
        difficulty: plan.difficulty,
        duration_weeks: plan.duration_weeks,
        tags: plan.tags,
        created_by: user.id,
        is_public: false
      })
      .select()
      .single()

    if (planError) throw planError

    // Then create phases, weeks, days, and exercises
    if (plan.phases) {
      for (const phase of plan.phases) {
        const { data: phaseData, error: phaseError } = await supabase
          .from('training_phases')
          .insert({
            plan_id: planData.id,
            phase_number: phase.phase_number,
            name: phase.name,
            description: phase.description,
            duration_weeks: phase.duration_weeks,
            goal: phase.goal,
            notes: phase.notes
          })
          .select()
          .single()

        if (phaseError) throw phaseError

        if (phase.weeks) {
          for (const week of phase.weeks) {
            const { data: weekData, error: weekError } = await supabase
              .from('training_weeks')
              .insert({
                phase_id: phaseData.id,
                week_number: week.week_number,
                name: week.name,
                focus: week.focus,
                notes: week.notes
              })
              .select()
              .single()

            if (weekError) throw weekError

            if (week.days) {
              for (const day of week.days) {
                const { data: dayData, error: dayError } = await supabase
                  .from('training_days')
                  .insert({
                    week_id: weekData.id,
                    day_number: day.day_number,
                    name: day.name,
                    focus: day.focus,
                    estimated_duration: day.estimated_duration,
                    notes: day.notes
                  })
                  .select()
                  .single()

                if (dayError) throw dayError

                if (day.exercises) {
                  for (const exercise of day.exercises) {
                    let exerciseId = exercise.exercise_id

                    // If this is a custom exercise, create it first
                    if (exercise.exercise?.is_custom && exercise.exercise.id.startsWith('custom-')) {
                      const customExercise = await createExercise({
                        name: exercise.exercise.name,
                        category: exercise.exercise.category,
                        muscle_groups: exercise.exercise.muscle_groups,
                        equipment: exercise.exercise.equipment,
                        instructions: exercise.exercise.instructions,
                        video_url: exercise.exercise.video_url,
                        difficulty: exercise.exercise.difficulty,
                        is_custom: true,
                        created_by: user.id
                      })
                      if (customExercise) {
                        exerciseId = customExercise.id
                      } else {
                        throw new Error(`Failed to create custom exercise: ${exercise.exercise.name}`)
                      }
                    }

                    const { error: exerciseError } = await supabase
                      .from('training_day_exercises')
                      .insert({
                        day_id: dayData.id,
                        exercise_id: exerciseId,
                        order_position: exercise.order,
                        target_sets: exercise.target_sets,
                        target_reps: exercise.target_reps,
                        target_weight: exercise.target_weight,
                        target_rpe: exercise.target_rpe,
                        rest_time_seconds: exercise.rest_time_seconds,
                        notes: exercise.notes
                      })

                    if (exerciseError) throw exerciseError
                  }
                }
              }
            }
          }
        }
      }
    }

    revalidatePath('/training')
    return planData
  } catch (error) {
    console.error('Error creating training plan:', error)
    return null
  }
}

export async function getUserTrainingPlans(): Promise<UserTrainingPlan[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('user_training_plans')
      .select(`
        *,
        training_plans (
          *,
          training_phases (
            *,
            training_weeks (
              *,
              training_days (
                *,
                training_day_exercises (
                  *,
                  exercises (*)
                )
              )
            )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user training plans:', error)
    return []
  }
}

export async function assignTrainingPlan(planId: string, startDate: string): Promise<UserTrainingPlan | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // First, deactivate any existing active plans
    await supabase
      .from('user_training_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    const { data, error } = await supabase
      .from('user_training_plans')
      .insert({
        user_id: user.id,
        plan_id: planId,
        start_date: startDate,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/training')
    return data
  } catch (error) {
    console.error('Error assigning training plan:', error)
    return null
  }
}

// Strength Workout Management
export async function getStrengthWorkouts(limit?: number): Promise<StrengthWorkout[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('strength_workouts')
      .select(`
        *,
        workout_exercises (
          *,
          exercises (*),
          exercise_sets (*)
        )
      `)
      .eq('user_id', user.id)
      .order('workout_date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching strength workouts:', error)
    return []
  }
}

export async function createStrengthWorkout(workout: Omit<StrengthWorkout, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<StrengthWorkout | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('strength_workouts')
      .insert({
        ...workout,
        user_id: user.id
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/training')
    return data
  } catch (error) {
    console.error('Error creating strength workout:', error)
    return null
  }
}

export async function updateStrengthWorkout(workoutId: string, updates: Partial<StrengthWorkout>): Promise<StrengthWorkout | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('strength_workouts')
      .update(updates)
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/training')
    return data
  } catch (error) {
    console.error('Error updating strength workout:', error)
    return null
  }
}

// Exercise Set Management
export async function addExerciseSet(workoutExerciseId: string, setData: Omit<ExerciseSet, 'id' | 'exercise_id' | 'created_at'>): Promise<ExerciseSet | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Verify the workout belongs to the user
    const { data: workoutExercise } = await supabase
      .from('workout_exercises')
      .select(`
        workout_id,
        strength_workouts!inner(user_id)
      `)
      .eq('id', workoutExerciseId)
      .single()

    if (!workoutExercise || (workoutExercise.strength_workouts as any)?.user_id !== user.id) {
      return null
    }

    const { data, error } = await supabase
      .from('exercise_sets')
      .insert({
        ...setData,
        workout_exercise_id: workoutExerciseId
      })
      .select()
      .single()

    if (error) throw error
    revalidatePath('/training')
    return data
  } catch (error) {
    console.error('Error adding exercise set:', error)
    return null
  }
}

export async function updateExerciseSet(setId: string, updates: Partial<ExerciseSet>): Promise<ExerciseSet | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Verify the set belongs to the user through workout ownership
    const { data: set } = await supabase
      .from('exercise_sets')
      .select(`
        *,
        workout_exercises (
          workout_id,
          strength_workouts!inner(user_id)
        )
      `)
      .eq('id', setId)
      .single()

    if (!set || set.workout_exercises.strength_workouts.user_id !== user.id) {
      return null
    }

    const { data, error } = await supabase
      .from('exercise_sets')
      .update(updates)
      .eq('id', setId)
      .select()
      .single()

    if (error) throw error
    revalidatePath('/training')
    return data
  } catch (error) {
    console.error('Error updating exercise set:', error)
    return null
  }
}

// Strength Performance Analytics
export async function getStrengthPerformanceMetrics(exerciseId?: string, limit = 50): Promise<StrengthPerformanceMetric[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('strength_performance_metrics')
      .select(`
        *,
        exercises (*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (exerciseId) {
      query = query.eq('exercise_id', exerciseId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching strength performance metrics:', error)
    return []
  }
}

export async function calculateStrengthGains(exerciseId: string): Promise<{
  exercise: Exercise
  max_weight: number
  total_volume: number
  strength_gains_percentage: number
  recent_performance: StrengthPerformanceMetric[]
} | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get exercise details
    const { data: exercise } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .single()

    if (!exercise) return null

    // Get recent performance metrics
    const { data: metrics } = await supabase
      .from('strength_performance_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_id', exerciseId)
      .eq('metric_type', 'max_weight')
      .order('date', { ascending: false })
      .limit(10)

    if (!metrics || metrics.length < 2) return null

    const maxWeight = Math.max(...metrics.map(m => m.value))
    const oldestWeight = metrics[metrics.length - 1].value
    const newestWeight = metrics[0].value
    const strengthGainsPercentage = ((newestWeight - oldestWeight) / oldestWeight) * 100

    return {
      exercise,
      max_weight: maxWeight,
      total_volume: metrics.reduce((sum, m) => sum + m.value, 0),
      strength_gains_percentage: Math.round(strengthGainsPercentage * 10) / 10,
      recent_performance: metrics
    }
  } catch (error) {
    console.error('Error calculating strength gains:', error)
    return null
  }
}
