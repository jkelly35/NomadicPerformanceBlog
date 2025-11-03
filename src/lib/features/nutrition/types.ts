// Nutrition-specific types
export interface NutritionGoal {
  id: string
  user_id: string
  goal_type: 'daily_calories' | 'protein_target' | 'carb_target' | 'fat_target'
  target_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  user_id?: string
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
  food_items?: Array<{
    id: string
    name: string
    brand?: string
    quantity: number
    serving_size: number
    serving_unit: string
  }>
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
  created_at?: string
  updated_at?: string
}

export interface NutritionStats {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  meals_count: number
}

export interface NutritionInsight {
  id: string
  type: 'nutrition'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  recommendation?: string
  data?: any
  created_at: string
}
