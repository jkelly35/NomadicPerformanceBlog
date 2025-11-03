'use server'

import { createClient } from '@/lib/supabase-server'
import type { NutritionInsight } from './types'

// Import hydration function for cross-feature integration
async function getDailyHydrationTotal(date: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data } = await supabase
      .from('hydration_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .eq('created_at', date)

    return (data || []).reduce((sum, log) => sum + (log.amount_ml || 0), 0)
  } catch (error) {
    console.error('Error getting hydration total:', error)
    return 0
  }
}

export async function generateNutritionInsights(): Promise<NutritionInsight[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const insights: NutritionInsight[] = []
    const today = new Date()
    const todayString = (() => {
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()

    // Get today's meals and nutrition data
    const { data: todayMeals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('meal_date', todayString)

    // Get user's nutrition goals
    const { data: nutritionGoals } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get recent meal history for comparison (last 7 days)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)
    const sevenDaysAgoString = (() => {
      const year = sevenDaysAgo.getFullYear()
      const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')
      const day = String(sevenDaysAgo.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()
    const { data: recentMeals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('meal_date', sevenDaysAgoString)

    // Calculate today's nutrition stats
    const todayStats = todayMeals?.reduce((acc, meal) => ({
      calories: acc.calories + (meal.total_calories || 0),
      protein: acc.protein + (meal.total_protein || 0),
      carbs: acc.carbs + (meal.total_carbs || 0),
      fat: acc.fat + (meal.total_fat || 0),
      fiber: acc.fiber + (meal.total_fiber || 0),
      meals: acc.meals + 1
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 }

    // Get nutrition goals
    const calorieGoal = nutritionGoals?.find(g => g.goal_type === 'daily_calories')?.target_value || 2200
    const proteinGoal = nutritionGoals?.find(g => g.goal_type === 'protein_target')?.target_value || 150
    const carbGoal = nutritionGoals?.find(g => g.goal_type === 'carb_target')?.target_value || 250
    const fatGoal = nutritionGoals?.find(g => g.goal_type === 'fat_target')?.target_value || 70

    // Calculate average daily intake from recent meals
    const dailyAverages = recentMeals?.reduce((acc, meal) => {
      const date = meal.meal_date
      if (!acc[date]) acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
      acc[date].calories += meal.total_calories || 0
      acc[date].protein += meal.total_protein || 0
      acc[date].carbs += meal.total_carbs || 0
      acc[date].fat += meal.total_fat || 0
      acc[date].meals += 1
      return acc
    }, {} as Record<string, any>) || {}

    const avgCalories = Object.values(dailyAverages).reduce((sum: number, day: any) => sum + day.calories, 0) / Math.max(1, Object.keys(dailyAverages).length)
    const avgProtein = Object.values(dailyAverages).reduce((sum: number, day: any) => sum + day.protein, 0) / Math.max(1, Object.keys(dailyAverages).length)

    // CURRENT DAY INSIGHTS - Priority 1

    // 1. Calorie tracking insight
    const calorieProgress = (todayStats.calories / calorieGoal) * 100
    if (todayStats.calories > 0) {
      if (calorieProgress >= 90) {
        insights.push({
          id: 'nutrition-calories-near-goal',
          type: 'nutrition',
          priority: 'high',
          title: 'Almost at Calorie Goal! 🎯',
          message: `You've consumed ${Math.round(todayStats.calories)} of ${calorieGoal} calories today.`,
          recommendation: 'Consider lighter snacks or focus on nutrient-dense foods to finish strong.',
          data: { current: Math.round(todayStats.calories), goal: calorieGoal, progress: Math.round(calorieProgress) },
          created_at: new Date().toISOString()
        })
      } else if (calorieProgress >= 75) {
        insights.push({
          id: 'nutrition-calories-good-pace',
          type: 'nutrition',
          priority: 'low',
          title: 'Good Calorie Pace 📈',
          message: `You're at ${Math.round(calorieProgress)}% of your ${calorieGoal} calorie goal.`,
          recommendation: 'Keep up the great work! You\'re on track for a balanced day.',
          data: { current: Math.round(todayStats.calories), goal: calorieGoal, progress: Math.round(calorieProgress) },
          created_at: new Date().toISOString()
        })
      } else if (todayStats.calories > avgCalories * 1.2 && avgCalories > 0) {
        insights.push({
          id: 'nutrition-calories-above-average',
          type: 'nutrition',
          priority: 'medium',
          title: 'Higher Calorie Intake Today ⚠️',
          message: `You've consumed ${Math.round(todayStats.calories)} calories, which is above your ${Math.round(avgCalories)}-calorie daily average.`,
          recommendation: 'Be mindful of your remaining calories. Consider lighter meal options for the rest of the day.',
          data: { current: Math.round(todayStats.calories), average: Math.round(avgCalories) },
          created_at: new Date().toISOString()
        })
      }
    }

    // 2. Protein intake insight
    const proteinProgress = (todayStats.protein / proteinGoal) * 100
    if (todayStats.protein > 0) {
      if (proteinProgress < 50) {
        insights.push({
          id: 'nutrition-protein-low',
          type: 'nutrition',
          priority: 'high',
          title: 'Protein Intake Needs Attention 💪',
          message: `You've only consumed ${Math.round(todayStats.protein)}g of your ${proteinGoal}g protein goal.`,
          recommendation: 'Add protein-rich foods like chicken, fish, eggs, Greek yogurt, or nuts to your next meal.',
          data: { current: Math.round(todayStats.protein), goal: proteinGoal, progress: Math.round(proteinProgress) },
          created_at: new Date().toISOString()
        })
      } else if (proteinProgress >= 80) {
        insights.push({
          id: 'nutrition-protein-good',
          type: 'nutrition',
          priority: 'low',
          title: 'Strong Protein Intake 💪',
          message: `Great job! You're at ${Math.round(proteinProgress)}% of your protein goal.`,
          recommendation: 'Keep prioritizing protein-rich foods to maintain muscle recovery and energy.',
          data: { current: Math.round(todayStats.protein), goal: proteinGoal, progress: Math.round(proteinProgress) },
          created_at: new Date().toISOString()
        })
      }
    }

    // 3. Meal timing and frequency insight
    const currentHour = today.getHours()
    if (currentHour >= 12 && currentHour <= 14 && todayStats.meals === 0) {
      insights.push({
        id: 'nutrition-missed-lunch',
        type: 'nutrition',
        priority: 'high',
        title: 'Time for Lunch! 🥗',
        message: 'It\'s lunchtime and you haven\'t logged any meals yet today.',
        recommendation: 'Fuel up with a balanced meal containing protein, complex carbs, and vegetables.',
        created_at: new Date().toISOString()
      })
    } else if (currentHour >= 18 && currentHour <= 20 && todayStats.meals < 2) {
      insights.push({
        id: 'nutrition-dinner-time',
        type: 'nutrition',
        priority: 'medium',
        title: 'Dinner Time Approaches 🍽️',
        message: `You've had ${todayStats.meals} meal${todayStats.meals !== 1 ? 's' : ''} today. Consider planning your evening meal.`,
        recommendation: 'Opt for a nutrient-dense dinner to support overnight recovery and tomorrow\'s performance.',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // 4. Hydration reminder (if meals logged but hydration not tracked)
    const totalHydration = await getDailyHydrationTotal(todayString)
    if (todayStats.meals > 0 && totalHydration < 1500) {
      insights.push({
        id: 'nutrition-hydration-reminder',
        type: 'nutrition',
        priority: 'medium',
        title: 'Stay Hydrated 💧',
        message: `You've logged meals but only ${totalHydration}ml of water today.`,
        recommendation: 'Aim for at least 2-3 liters of water daily. Hydration supports nutrient absorption and performance.',
        data: { hydrationToday: totalHydration },
        created_at: new Date().toISOString()
      })
    }

    // GENERAL INSIGHTS - Priority 2 (only if no current day insights)

    if (insights.length === 0) {
      // No meals logged today
      if (todayStats.meals === 0) {
        insights.push({
          id: 'nutrition-start-day',
          type: 'nutrition',
          priority: 'high',
          title: 'Start Your Nutrition Day 🌅',
          message: 'You haven\'t logged any meals yet today.',
          recommendation: 'Begin with a balanced breakfast containing protein, complex carbs, and healthy fats to fuel your day.',
          created_at: new Date().toISOString()
        })
      }

      // General protein insight based on history
      if (avgProtein > 0 && avgProtein < proteinGoal * 0.8) {
        insights.push({
          id: 'nutrition-general-protein',
          type: 'nutrition',
          priority: 'medium',
          title: 'Consider Increasing Protein 🥩',
          message: `Your average daily protein intake is ${Math.round(avgProtein)}g, below your ${proteinGoal}g goal.`,
          recommendation: 'Focus on protein-rich foods like lean meats, fish, eggs, dairy, legumes, and nuts.',
          data: { average: Math.round(avgProtein), goal: proteinGoal },
          created_at: new Date().toISOString()
        })
      }
    }

    return insights
  } catch (error) {
    console.error('Error generating nutrition insights:', error)
    return []
  }
}
