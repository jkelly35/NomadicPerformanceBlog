'use client'

import { useState, useEffect } from 'react'
import { getSmartRecipeSuggestions, MealDBRecipe, NutritionGoal } from '@/lib/fitness-data'

interface SmartRecipeSuggestionsProps {
  userGoals: NutritionGoal[]
  onRecipeSelect: (recipe: MealDBRecipe) => void
}

export default function SmartRecipeSuggestions({ userGoals, onRecipeSelect }: SmartRecipeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<MealDBRecipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const categories = [
    'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack',
    'Vegetarian', 'Vegan', 'High Protein', 'Low Carb', 'Keto'
  ]

  useEffect(() => {
    loadSuggestions()
  }, [selectedCategory])

  const loadSuggestions = async () => {
    setIsLoading(true)
    try {
      // Analyze user goals to determine preferences and time of day
      const preferences = analyzeUserPreferences(userGoals)
      const timeOfDay = selectedCategory.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack' || 'breakfast'

      // Get smart suggestions based on goals and category
      const recipes = await getSmartRecipeSuggestions(
        timeOfDay,
        preferences
      )

      setSuggestions(recipes)
    } catch (error) {
      console.error('Error loading recipe suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeUserPreferences = (goals: NutritionGoal[]) => {
    const preferences: string[] = []

    goals.forEach(goal => {
      if (goal.goal_type === 'daily_calories' && goal.target_value < 2000) {
        preferences.push('low-calorie')
      }
      if (goal.goal_type === 'protein_target' && goal.target_value > 150) {
        preferences.push('high-protein')
      }
      if (goal.goal_type === 'carb_target' && goal.target_value < 100) {
        preferences.push('low-carb')
      }
    })

    return preferences
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Smart Recipe Suggestions</h3>
          <p className="text-sm text-gray-600">AI-powered recipes based on your goals</p>
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-48 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((recipe) => (
            <div
              key={recipe.idMeal}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onRecipeSelect(recipe)}
            >
              <img
                src={recipe.strMealThumb}
                alt={recipe.strMeal}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {recipe.strMeal}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                    {recipe.strCategory}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {recipe.strArea}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRecipeSelect(recipe)
                  }}
                  className="mt-3 w-full bg-orange-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                >
                  Plan This Recipe
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestions.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">🍽️</div>
          <p>No recipes found for the selected criteria.</p>
          <p className="text-sm">Try selecting a different category or check back later.</p>
        </div>
      )}
    </div>
  )
}
