// Nutrition data validation utilities

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateNutritionGoal(data: {
  goal_type: string
  target_value: number
  period?: string
}): ValidationResult {
  const errors: string[] = []

  // Validate goal type
  const validGoalTypes = ['daily_calories', 'protein_target', 'carb_target', 'fat_target']
  if (!validGoalTypes.includes(data.goal_type)) {
    errors.push('Invalid goal type')
  }

  // Validate target value
  if (typeof data.target_value !== 'number' || data.target_value <= 0) {
    errors.push('Target value must be a positive number')
  }

  // Validate period
  if (data.period && !['daily', 'weekly', 'monthly'].includes(data.period)) {
    errors.push('Invalid period')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateMealData(formData: FormData): ValidationResult {
  const errors: string[] = []

  const mealType = formData.get('meal_type') as string
  const mealDate = formData.get('meal_date') as string

  // Validate meal type
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'hydration']
  if (!mealType || !validMealTypes.includes(mealType)) {
    errors.push('Invalid meal type')
  }

  // Validate meal date
  if (!mealDate) {
    errors.push('Meal date is required')
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(mealDate)) {
      errors.push('Invalid date format (expected YYYY-MM-DD)')
    }
  }

  // Validate food items
  let hasValidFoodItem = false
  let index = 0
  while (true) {
    const foodId = formData.get(`food_${index}`) as string
    const quantity = formData.get(`quantity_${index}`) as string

    if (!foodId && !quantity) break

    if (foodId && quantity) {
      const qty = parseFloat(quantity)
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Invalid quantity for food item ${index + 1}`)
      } else {
        hasValidFoodItem = true
      }
    }
    index++
  }

  if (!hasValidFoodItem && mealType !== 'hydration') {
    errors.push('At least one food item with valid quantity is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateFoodItem(data: {
  name: string
  serving_size: number
  serving_unit: string
  calories_per_serving: number
}): ValidationResult {
  const errors: string[] = []

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Food name is required')
  }

  // Validate serving size
  if (typeof data.serving_size !== 'number' || data.serving_size <= 0) {
    errors.push('Serving size must be a positive number')
  }

  // Validate serving unit
  if (!data.serving_unit || data.serving_unit.trim().length === 0) {
    errors.push('Serving unit is required')
  }

  // Validate calories
  if (typeof data.calories_per_serving !== 'number' || data.calories_per_serving < 0) {
    errors.push('Calories per serving must be a non-negative number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateNutritionStats(stats: {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
}): ValidationResult {
  const errors: string[] = []

  // All values should be non-negative numbers
  const fields = ['total_calories', 'total_protein', 'total_carbs', 'total_fat', 'total_fiber']
  fields.forEach(field => {
    const value = stats[field as keyof typeof stats]
    if (typeof value !== 'number' || value < 0) {
      errors.push(`${field} must be a non-negative number`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}
