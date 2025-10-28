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
  period: string
  is_active: boolean
}

export interface UserStat {
  stat_type: string
  value: number
  calculated_date: string
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

    const activity_type = formData.get('activity_type') as string
    const duration_minutes = parseInt(formData.get('duration_minutes') as string)
    const calories_burned = formData.get('calories_burned') ? parseInt(formData.get('calories_burned') as string) : null
    const intensity = formData.get('intensity') as 'Low' | 'Medium' | 'High'
    const notes = formData.get('notes') as string
    const workout_date = formData.get('workout_date') as string || new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('workouts')
      .insert({
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
