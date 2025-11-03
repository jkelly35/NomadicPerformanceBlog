// Nutrition Feature Module
// Exports all nutrition-related functionality

// Types
export type {
  NutritionGoal,
  Meal,
  FoodItem,
  NutritionStats,
  NutritionInsight
} from './types'

// Data operations
export {
  upsertNutritionGoal,
  getDailyNutritionStats,
  logMeal,
  deleteMeal,
  getFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem
} from './data'

// Insights generation
export {
  generateNutritionInsights
} from './insights'

// Validation utilities
export {
  validateNutritionGoal,
  validateMealData,
  validateFoodItem,
  validateNutritionStats,
  type ValidationResult
} from './validation'
