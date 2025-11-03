'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import type { NutritionGoal, Meal, FoodItem, NutritionStats } from './types'

// Nutrition Goals
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
export async function getDailyNutritionStats(date: string): Promise<NutritionStats> {
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
      (acc: NutritionStats, meal) => ({
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

// Meal Logging
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

    console.log('logMeal: mealDate =', mealDate, 'mealType =', mealType)

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

// Food Items Management
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
