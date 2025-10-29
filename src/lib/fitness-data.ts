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
  created_at: string
}

export interface Meal {
  id: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
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

    const mealData = {
      meal_type: formData.get('meal_type') as string,
      meal_date: formData.get('meal_date') as string || new Date().toISOString().split('T')[0],
      meal_time: formData.get('meal_time') as string || null,
      total_calories: parseInt(formData.get('total_calories') as string) || 0,
      total_protein: parseFloat(formData.get('total_protein') as string) || 0,
      total_carbs: parseFloat(formData.get('total_carbs') as string) || 0,
      total_fat: parseFloat(formData.get('total_fat') as string) || 0,
      total_fiber: parseFloat(formData.get('total_fiber') as string) || 0,
      notes: formData.get('notes') as string || null
    }

    const { data, error } = await supabase
      .from('meals')
      .insert([mealData])
      .select()
      .single()

    if (error) {
      console.error('Error logging meal:', error)
      return { success: false, error: 'Failed to log meal' }
    }

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    console.error('Error in logMeal:', error)
    return { success: false, error: 'Failed to log meal' }
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
      sodium_mg: parseFloat(formData.get('sodium_mg') as string) || 0
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
