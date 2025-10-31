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

// Create custom goal
export async function createCustomGoal(goalData: {
  goal_type: string
  target_value: number
  period: string
  description?: string
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
      period: goalData.period,
      is_active: true
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
    const mealDate = formData.get('meal_date') as string || new Date().toISOString().split('T')[0]
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
      .select('*')
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

    const amount_ml = parseInt(formData.get('amount_ml') as string)
    const beverage_type = formData.get('beverage_type') as string
    const notes = formData.get('notes') as string

    const { data, error } = await supabase
      .from('hydration_logs')
      .insert({
        amount_ml,
        beverage_type,
        notes
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging hydration:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/nutrition')
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

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('hydration_logs')
      .select('amount_ml')
      .gte('logged_time', startOfDay.toISOString())
      .lte('logged_time', endOfDay.toISOString())

    if (error) {
      console.error('Error fetching daily hydration:', error)
      return 0
    }

    return data?.reduce((total, log) => total + log.amount_ml, 0) || 0
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

    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('caffeine_logs')
      .select('amount_mg')
      .gte('logged_time', startOfDay.toISOString())
      .lte('logged_time', endOfDay.toISOString())

    if (error) {
      console.error('Error fetching daily caffeine:', error)
      return 0
    }

    return data?.reduce((total, log) => total + log.amount_mg, 0) || 0
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
