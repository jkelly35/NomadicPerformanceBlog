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

// Get daily caffeine total
async function getDailyCaffeineTotal(date: string): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    const { data } = await supabase
      .from('caffeine_logs')
      .select('amount_mg')
      .eq('user_id', user.id)
      .eq('created_at', date)

    return (data || []).reduce((sum, log) => sum + (log.amount_mg || 0), 0)
  } catch (error) {
    console.error('Error getting caffeine total:', error)
    return 0
  }
}

// Check if user had a heavy workout today
async function hadHeavyWorkoutToday(date: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('workout_date', date)
      .limit(1)

    return (data && data.length > 0) || false
  } catch (error) {
    console.error('Error checking workout:', error)
    return false
  }
}

// Get meal logging streak
async function getMealLoggingStreak(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Get meals for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: meals } = await supabase
      .from('meals')
      .select('meal_date')
      .eq('user_id', user.id)
      .gte('meal_date', thirtyDaysAgoString)
      .order('meal_date', { ascending: false })

    if (!meals || meals.length === 0) return 0

    // Group by date and count unique days with meals
    const mealDates = [...new Set(meals.map(m => m.meal_date))]
    mealDates.sort((a, b) => b.localeCompare(a)) // Most recent first

    let streak = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < mealDates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateString = expectedDate.toISOString().split('T')[0]

      if (mealDates.includes(expectedDateString)) {
        streak++
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Error getting meal logging streak:', error)
    return 0
  }
}

// Get hydration streak
async function getHydrationStreak(): Promise<number> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Get hydration logs for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoString = thirtyDaysAgo.toISOString().split('T')[0]

    const { data: hydrationLogs } = await supabase
      .from('hydration_logs')
      .select('created_at, amount_ml')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgoString)

    if (!hydrationLogs || hydrationLogs.length === 0) return 0

    // Group by date and check if daily goal (2000ml) was met
    const hydrationByDate: Record<string, number> = {}
    hydrationLogs.forEach(log => {
      const date = log.created_at.split('T')[0]
      hydrationByDate[date] = (hydrationByDate[date] || 0) + (log.amount_ml || 0)
    })

    const dates = Object.keys(hydrationByDate).sort((a, b) => b.localeCompare(a))
    let streak = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateString = expectedDate.toISOString().split('T')[0]

      if (dates.includes(expectedDateString) && hydrationByDate[expectedDateString] >= 2000) {
        streak++
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Error getting hydration streak:', error)
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
    const todayString = today.toISOString().split('T')[0]
    const currentHour = today.getHours()

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
    const sevenDaysAgoString = sevenDaysAgo.toISOString().split('T')[0]
    const { data: recentMeals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('meal_date', sevenDaysAgoString)

    // Get 3-day meal history for pattern analysis
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(today.getDate() - 3)
    const threeDaysAgoString = threeDaysAgo.toISOString().split('T')[0]
    const { data: threeDayMeals } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', user.id)
      .gte('meal_date', threeDaysAgoString)

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

    // Get additional data for advanced insights
    const totalHydration = await getDailyHydrationTotal(todayString)
    const totalCaffeine = await getDailyCaffeineTotal(todayString)
    const hadWorkout = await hadHeavyWorkoutToday(todayString)
    const mealStreak = await getMealLoggingStreak()
    const hydrationStreak = await getHydrationStreak()

    // Calculate 3-day averages for pattern analysis
    const threeDayStats = threeDayMeals?.reduce((acc, meal) => {
      const date = meal.meal_date
      if (!acc[date]) acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, meals: 0 }
      acc[date].calories += meal.total_calories || 0
      acc[date].protein += meal.total_protein || 0
      acc[date].carbs += meal.total_carbs || 0
      acc[date].fat += meal.total_fat || 0
      acc[date].fiber += meal.total_fiber || 0
      acc[date].meals += 1
      return acc
    }, {} as Record<string, any>) || {}

    const threeDayAvgCalories = Object.values(threeDayStats).reduce((sum: number, day: any) => sum + day.calories, 0) / Math.max(1, Object.keys(threeDayStats).length)
    const threeDayAvgProtein = Object.values(threeDayStats).reduce((sum: number, day: any) => sum + day.protein, 0) / Math.max(1, Object.keys(threeDayStats).length)
    const threeDayAvgFiber = Object.values(threeDayStats).reduce((sum: number, day: any) => sum + day.fiber, 0) / Math.max(1, Object.keys(threeDayStats).length)

    // Calculate macro percentages
    const totalMacros = todayStats.calories > 0 ? todayStats.protein * 4 + todayStats.carbs * 4 + todayStats.fat * 9 : 0
    const proteinPercent = totalMacros > 0 ? (todayStats.protein * 4 / totalMacros) * 100 : 0
    const carbPercent = totalMacros > 0 ? (todayStats.carbs * 4 / totalMacros) * 100 : 0
    const fatPercent = totalMacros > 0 ? (todayStats.fat * 9 / totalMacros) * 100 : 0

    // Calculate progress percentages
    const calorieProgress = (todayStats.calories / calorieGoal) * 100
    const proteinProgress = (todayStats.protein / proteinGoal) * 100
    const hydrationTarget = 2000 // ml
    const hydrationProgress = (totalHydration / hydrationTarget) * 100

    // ==================== HIGH PRIORITY INSIGHTS ====================

    // 🔴 Critical Nutrition Feedback

    // 1. Fuel Tank Running Low - calorie intake < 60% of goal by 6 PM
    if (currentHour >= 18 && calorieProgress < 60) {
      insights.push({
        id: 'nutrition-fuel-tank-low',
        type: 'nutrition',
        priority: 'high',
        title: 'Fuel Tank Running Low ⛽️',
        message: `You've only consumed ${Math.round(calorieProgress)}% of your ${calorieGoal} calorie goal and it's already 6 PM.`,
        recommendation: 'Consider a nutrient-dense meal or snack to maintain energy levels and prevent fatigue.',
        data: { currentProgress: Math.round(calorieProgress), goal: calorieGoal, currentHour },
        created_at: new Date().toISOString()
      })
    }

    // 2. Protein Gap Detected - protein < 0.8g/kg body weight (simplified to < 0.8g per pound for now)
    // Note: This would ideally use user's weight from profile, but simplified for now
    const estimatedWeight = 70 // kg - would need to get from user profile
    const proteinPerKgGoal = 0.8
    const absoluteProteinGoal = estimatedWeight * proteinPerKgGoal
    if (todayStats.protein < absoluteProteinGoal) {
      insights.push({
        id: 'nutrition-protein-gap',
        type: 'nutrition',
        priority: 'high',
        title: 'Protein Gap Detected 🥩',
        message: `Your protein intake (${Math.round(todayStats.protein)}g) is below the recommended 0.8g per kg of body weight.`,
        recommendation: 'Prioritize protein-rich foods like chicken, fish, eggs, Greek yogurt, tofu, or legumes to support muscle maintenance and recovery.',
        data: { current: Math.round(todayStats.protein), recommended: Math.round(absoluteProteinGoal) },
        created_at: new Date().toISOString()
      })
    }

    // 3. Over the Limit - calorie intake > 120% of daily goal
    if (calorieProgress > 120) {
      insights.push({
        id: 'nutrition-over-limit',
        type: 'nutrition',
        priority: 'high',
        title: 'Over the Limit 🚨',
        message: `You've consumed ${Math.round(calorieProgress)}% of your ${calorieGoal} calorie goal (${Math.round(todayStats.calories)} calories).`,
        recommendation: 'Consider lighter options for remaining meals and focus on nutrient-dense foods to avoid exceeding your goals.',
        data: { current: Math.round(todayStats.calories), goal: calorieGoal, progress: Math.round(calorieProgress) },
        created_at: new Date().toISOString()
      })
    }

    // 4. Missed Recovery Window - no post-workout intake within 2 hours
    if (hadWorkout && todayStats.meals > 0) {
      // This would need more complex logic to check timing of meals vs workouts
      // Simplified version - if workout logged and low recent intake
      const recentMeals = todayMeals?.filter(meal => {
        if (!meal.created_at) return false
        const mealTime = new Date(meal.created_at).getTime()
        const now = new Date().getTime()
        const hoursDiff = (now - mealTime) / (1000 * 60 * 60)
        return hoursDiff <= 2
      }) || []

      if (recentMeals.length === 0) {
        insights.push({
          id: 'nutrition-missed-recovery',
          type: 'nutrition',
          priority: 'high',
          title: 'Missed Recovery Window 🕒',
          message: 'Workout detected but no nutrition logged within the past 2 hours.',
          recommendation: 'Consume a recovery meal or snack with protein and carbs within 2 hours of training to optimize muscle repair and glycogen replenishment.',
          data: { hadWorkout: true },
          created_at: new Date().toISOString()
        })
      }
    }

    // 5. Low-Carb Dip - carbs < 30% of total intake 2+ days in a row
    if (todayStats.calories > 0 && carbPercent < 30 && threeDayAvgFiber > 0) {
      // Check if this is a pattern (simplified - would need better historical tracking)
      insights.push({
        id: 'nutrition-low-carb-dip',
        type: 'nutrition',
        priority: 'high',
        title: 'Low-Carb Dip ⚡️',
        message: `Your carb intake is only ${Math.round(carbPercent)}% of calories, below 30% for multiple days.`,
        recommendation: 'Include more complex carbohydrates to maintain energy levels and prevent fatigue. Consider fruits, vegetables, whole grains, or legumes.',
        data: { carbPercent: Math.round(carbPercent), proteinPercent: Math.round(proteinPercent), fatPercent: Math.round(fatPercent) },
        created_at: new Date().toISOString()
      })
    }

    // 6. High-Fat Stretch - fat > 40% of intake 3+ days in a row
    if (todayStats.calories > 0 && fatPercent > 40) {
      insights.push({
        id: 'nutrition-high-fat-stretch',
        type: 'nutrition',
        priority: 'high',
        title: 'High-Fat Stretch �',
        message: `Your fat intake is ${Math.round(fatPercent)}% of calories, above 40% for multiple days.`,
        recommendation: 'Balance your macros by including more lean proteins and complex carbohydrates while moderating high-fat foods.',
        data: { fatPercent: Math.round(fatPercent), proteinPercent: Math.round(proteinPercent), carbPercent: Math.round(carbPercent) },
        created_at: new Date().toISOString()
      })
    }

    // 7. Hydration Debt - under 50% of hydration target for 2+ consecutive days
    if (hydrationProgress < 50) {
      insights.push({
        id: 'nutrition-hydration-debt',
        type: 'nutrition',
        priority: 'high',
        title: 'Hydration Debt �',
        message: `You've only consumed ${totalHydration}ml of water (${Math.round(hydrationProgress)}% of your 2L goal).`,
        recommendation: 'Increase water intake immediately. Proper hydration supports nutrient absorption, temperature regulation, and performance.',
        data: { hydrationToday: totalHydration, target: hydrationTarget, progress: Math.round(hydrationProgress) },
        created_at: new Date().toISOString()
      })
    }

    // 8. Electrolyte Imbalance - excessive sodium >3000mg (simplified)
    // This would need sodium tracking in food database
    if (todayStats.meals > 0) {
      insights.push({
        id: 'nutrition-electrolyte-imbalance',
        type: 'nutrition',
        priority: 'high',
        title: 'Electrolyte Awareness ⚡️',
        message: 'Monitor sodium intake, especially with processed foods.',
        recommendation: 'Aim for 1500-2300mg of sodium daily. Balance with potassium-rich foods like bananas, sweet potatoes, and leafy greens.',
        created_at: new Date().toISOString()
      })
    }

    // 9. Post-Workout Rehydration Needed - exercise logged but no hydration afterward
    if (hadWorkout && totalHydration < 500) {
      insights.push({
        id: 'nutrition-post-workout-rehydration',
        type: 'nutrition',
        priority: 'high',
        title: 'Post-Workout Rehydration Needed 🥤',
        message: 'Workout logged but hydration intake is very low today.',
        recommendation: 'Replenish fluids lost during exercise. Aim for additional water and consider an electrolyte drink for intense or long sessions.',
        data: { hadWorkout: true, hydrationToday: totalHydration },
        created_at: new Date().toISOString()
      })
    }

    // 10. Micronutrient deficiency risks (simplified placeholders)
    if (todayStats.meals > 0) {
      insights.push({
        id: 'nutrition-iron-awareness',
        type: 'nutrition',
        priority: 'high',
        title: 'Iron-Rich Foods Reminder 🩸',
        message: 'Include iron-rich foods like red meat, spinach, lentils, or fortified cereals.',
        recommendation: 'Pair iron-rich foods with vitamin C sources (citrus, bell peppers) for better absorption.',
        created_at: new Date().toISOString()
      })

      insights.push({
        id: 'nutrition-vitamin-d-awareness',
        type: 'nutrition',
        priority: 'high',
        title: 'Vitamin D Sources ☀️',
        message: 'Consider vitamin D-rich foods like fatty fish, egg yolks, or fortified foods.',
        recommendation: 'Get sunlight exposure when possible, or consider a supplement if intake is consistently low.',
        created_at: new Date().toISOString()
      })

      insights.push({
        id: 'nutrition-calcium-awareness',
        type: 'nutrition',
        priority: 'high',
        title: 'Calcium Sources 🦴',
        message: 'Include calcium-rich foods like dairy, leafy greens, tofu, or fortified plant milks.',
        recommendation: 'Aim for 1000mg daily through diet or supplements if needed.',
        created_at: new Date().toISOString()
      })

      insights.push({
        id: 'nutrition-omega3-awareness',
        type: 'nutrition',
        priority: 'high',
        title: 'Omega-3 Sources 🐟',
        message: 'Include fatty fish, flaxseeds, chia seeds, or walnuts for omega-3 fatty acids.',
        recommendation: 'Aim for 1-2 servings of omega-3 rich foods weekly for heart and brain health.',
        created_at: new Date().toISOString()
      })
    }

    // ==================== MEDIUM PRIORITY INSIGHTS ====================

    // 🟡 Performance & Pattern Insights

    // 8. Weekend Overindulgence - weekend average > weekday average by 20%
    const weekdayMeals = recentMeals?.filter(meal => {
      const date = new Date(meal.meal_date)
      return date.getDay() >= 1 && date.getDay() <= 5 // Monday-Friday
    }) || []
    const weekendMeals = recentMeals?.filter(meal => {
      const date = new Date(meal.meal_date)
      return date.getDay() === 0 || date.getDay() === 6 // Saturday-Sunday
    }) || []

    const weekdayAvg = weekdayMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / Math.max(1, weekdayMeals.length)
    const weekendAvg = weekendMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / Math.max(1, weekendMeals.length)

    if (weekdayAvg > 0 && weekendAvg > weekdayAvg * 1.2) {
      insights.push({
        id: 'nutrition-weekend-overindulgence',
        type: 'nutrition',
        priority: 'medium',
        title: 'Weekend Overindulgence 🍕',
        message: `Your weekend calorie average (${Math.round(weekendAvg)}) is 20% higher than weekdays (${Math.round(weekdayAvg)}).`,
        recommendation: 'Consider maintaining more consistent intake throughout the week for better energy stability and body composition goals.',
        data: { weekendAverage: Math.round(weekendAvg), weekdayAverage: Math.round(weekdayAvg) },
        created_at: new Date().toISOString()
      })
    }

    // 9. Macro Consistency - hitting all macros within ±10% for 3+ days
    const recentDays = Object.keys(dailyAverages).slice(-3) // Last 3 days
    const consistentDays = recentDays.filter(date => {
      const day = dailyAverages[date]
      const dayTotal = day.calories
      if (dayTotal === 0) return false

      const dayProteinPercent = (day.protein * 4 / dayTotal) * 100
      const dayCarbPercent = (day.carbs * 4 / dayTotal) * 100
      const dayFatPercent = (day.fat * 9 / dayTotal) * 100

      return Math.abs(dayProteinPercent - proteinPercent) <= 10 &&
             Math.abs(dayCarbPercent - carbPercent) <= 10 &&
             Math.abs(dayFatPercent - fatPercent) <= 10
    })

    if (consistentDays.length >= 3 && todayStats.calories > 0) {
      insights.push({
        id: 'nutrition-macro-consistency',
        type: 'nutrition',
        priority: 'medium',
        title: 'Macro Consistency 👌',
        message: `You've maintained consistent macronutrient ratios within ±10% for the past ${consistentDays.length} days.`,
        recommendation: 'Great job maintaining balance! This consistency supports stable energy levels and body composition goals.',
        data: { consistentDays: consistentDays.length },
        created_at: new Date().toISOString()
      })
    }

    // 10. Balanced Intake Day - calories, protein, and hydration all above 80%
    if (calorieProgress >= 80 && proteinProgress >= 80 && hydrationProgress >= 80) {
      insights.push({
        id: 'nutrition-balanced-intake-day',
        type: 'nutrition',
        priority: 'medium',
        title: 'Balanced Intake Day 🥦',
        message: `Excellent! Your calories (${Math.round(calorieProgress)}%), protein (${Math.round(proteinProgress)}%), and hydration (${Math.round(hydrationProgress)}%) are all above 80% of targets.`,
        recommendation: 'Keep up this balanced approach for optimal performance and recovery.',
        data: { calorieProgress: Math.round(calorieProgress), proteinProgress: Math.round(proteinProgress), hydrationProgress: Math.round(hydrationProgress) },
        created_at: new Date().toISOString()
      })
    }

    // 11. Great Start to the Week - Monday calories & protein on target after weekend deviation
    const todayDay = today.getDay() // 0 = Sunday, 1 = Monday
    if (todayDay === 1 && calorieProgress >= 90 && proteinProgress >= 90 && weekendAvg > weekdayAvg * 1.1) {
      insights.push({
        id: 'nutrition-great-week-start',
        type: 'nutrition',
        priority: 'medium',
        title: 'Great Start to the Week 🌞',
        message: 'Strong Monday performance after weekend deviation! You\'re back on track.',
        recommendation: 'Build on this momentum by maintaining consistent nutrition throughout the week.',
        data: { calorieProgress: Math.round(calorieProgress), proteinProgress: Math.round(proteinProgress) },
        created_at: new Date().toISOString()
      })
    }

    // 12. Mindful Evenings - high sugar intake detected primarily at night
    // This would require analyzing meal timing and sugar content - simplified version
    const eveningMeals = todayMeals?.filter(meal => {
      if (!meal.meal_time) return false
      const hour = parseInt(meal.meal_time.split(':')[0])
      return hour >= 18 // After 6 PM
    }) || []

    if (eveningMeals.length > 0 && todayStats.meals > 0) {
      insights.push({
        id: 'nutrition-mindful-evenings',
        type: 'nutrition',
        priority: 'medium',
        title: 'Mindful Evenings 🌙',
        message: 'Evening eating pattern detected. Consider lighter, nutrient-dense options before bed.',
        recommendation: 'Focus on protein and fiber-rich foods in the evening to support overnight recovery and better sleep quality.',
        data: { eveningMeals: eveningMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // 13. Micronutrient Win - variety detected (would need food analysis)
    // Simplified version - just check if multiple meals logged
    if (todayStats.meals >= 3) {
      insights.push({
        id: 'nutrition-micronutrient-win',
        type: 'nutrition',
        priority: 'medium',
        title: 'Micronutrient Win 🌈',
        message: `You've logged ${todayStats.meals} meals today, suggesting good variety in your food choices.`,
        recommendation: 'Continue including diverse fruits, vegetables, and whole foods to maximize micronutrient intake.',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // 14. Caffeine Watch - over 400mg caffeine logged
    if (totalCaffeine > 400) {
      insights.push({
        id: 'nutrition-caffeine-watch',
        type: 'nutrition',
        priority: 'medium',
        title: 'Caffeine Watch ☕️',
        message: `You've consumed ${totalCaffeine}mg of caffeine today (recommended limit: 400mg).`,
        recommendation: 'Be mindful of caffeine timing and consider switching to decaf or herbal alternatives in the afternoon.',
        data: { caffeineToday: totalCaffeine },
        created_at: new Date().toISOString()
      })
    }

    // 15. Sodium Spike - sodium > 2500mg (would need sodium tracking)
    // Placeholder for when sodium tracking is implemented
    if (todayStats.meals > 0) {
      insights.push({
        id: 'nutrition-sodium-placeholder',
        type: 'nutrition',
        priority: 'medium',
        title: 'Sodium Awareness 🧂',
        message: 'Consider monitoring sodium intake, especially with processed foods.',
        recommendation: 'Aim for under 2300mg of sodium daily. Focus on whole foods and use herbs/spices for flavor.',
        created_at: new Date().toISOString()
      })
    }

    // Additional Medium Priority Insights from comprehensive list

    // 16. Front-Loaded Day - 70%+ of calories consumed before 3 PM
    const morningMeals = todayMeals?.filter(meal => {
      if (!meal.created_at) return false
      const mealTime = new Date(meal.created_at).getHours()
      return mealTime < 15 // Before 3 PM
    }) || []
    const morningCalories = morningMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0)
    const morningCaloriePercent = todayStats.calories > 0 ? (morningCalories / todayStats.calories) * 100 : 0

    if (morningCaloriePercent >= 70 && todayStats.calories > 0) {
      insights.push({
        id: 'nutrition-front-loaded-day',
        type: 'nutrition',
        priority: 'medium',
        title: 'Front-Loaded Day 🍳',
        message: `${Math.round(morningCaloriePercent)}% of your calories consumed before 3 PM - great for energy balance!`,
        recommendation: 'This eating pattern supports stable energy levels throughout the day. Keep up the good work!',
        data: { morningPercent: Math.round(morningCaloriePercent) },
        created_at: new Date().toISOString()
      })
    }

    // 17. Late-Night Calories - >25% of daily calories logged after 8 PM
    const lateEveningMeals = todayMeals?.filter(meal => {
      if (!meal.created_at) return false
      const mealTime = new Date(meal.created_at).getHours()
      return mealTime >= 20 // After 8 PM
    }) || []
    const eveningCalories = lateEveningMeals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0)
    const eveningCaloriePercent = todayStats.calories > 0 ? (eveningCalories / todayStats.calories) * 100 : 0

    if (eveningCaloriePercent > 25 && todayStats.calories > 0) {
      insights.push({
        id: 'nutrition-late-night-calories',
        type: 'nutrition',
        priority: 'medium',
        title: 'Late-Night Calories 🌙',
        message: `${Math.round(eveningCaloriePercent)}% of your daily calories consumed after 8 PM.`,
        recommendation: 'Consider shifting some calories earlier in the day to support better sleep and recovery.',
        data: { eveningPercent: Math.round(eveningCaloriePercent) },
        created_at: new Date().toISOString()
      })
    }

    // 25. Evening Cravings Pattern - regular high sugar intake after 8 PM
    if (lateEveningMeals.length > 0 && todayStats.meals > 0) {
      insights.push({
        id: 'nutrition-evening-cravings',
        type: 'nutrition',
        priority: 'medium',
        title: 'Evening Cravings Pattern 🍫',
        message: 'Evening eating pattern detected.',
        recommendation: 'Consider protein-rich evening snacks to stabilize blood sugar and reduce cravings.',
        data: { eveningMeals: lateEveningMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // 18. Intermittent Fasting Detected - no intake for >14 hours between meals
    // This would require more complex analysis of meal timing gaps
    if (todayStats.meals >= 2) {
      insights.push({
        id: 'nutrition-intermittent-fasting',
        type: 'nutrition',
        priority: 'medium',
        title: 'Intermittent Fasting Detected ⏰',
        message: 'Your meal timing suggests an extended fasting window today.',
        recommendation: 'If intentional, this can support metabolic health. Ensure adequate nutrition during eating windows.',
        created_at: new Date().toISOString()
      })
    }

    // 19. Lunch Delay - skipped or delayed mid-day meal for 2+ days in a row
    const lunchMeals = todayMeals?.filter(meal => {
      if (!meal.created_at) return false
      const mealTime = new Date(meal.created_at).getHours()
      return mealTime >= 12 && mealTime <= 15 // Lunch time
    }) || []

    if (currentHour >= 15 && lunchMeals.length === 0) {
      insights.push({
        id: 'nutrition-lunch-delay',
        type: 'nutrition',
        priority: 'medium',
        title: 'Lunch Delay 🕛',
        message: 'No lunch logged during typical lunch hours (12-3 PM).',
        recommendation: 'Consider scheduling a balanced lunch to maintain energy levels and prevent overeating later.',
        created_at: new Date().toISOString()
      })
    }

    // 20. Balanced Meal Timing - all meals spaced 3–5 hours apart
    if (todayStats.meals >= 3) {
      // Simplified check - would need more complex timing analysis
      insights.push({
        id: 'nutrition-balanced-timing',
        type: 'nutrition',
        priority: 'medium',
        title: 'Balanced Meal Timing 🔁',
        message: `You've logged ${todayStats.meals} meals today with good spacing.`,
        recommendation: 'Consistent meal timing supports stable blood sugar and energy levels. Great job!',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // 21. Refueling Consistency - hitting carb+protein targets on training days
    if (hadWorkout && todayStats.carbs >= carbGoal * 0.7 && todayStats.protein >= proteinGoal * 0.7) {
      insights.push({
        id: 'nutrition-refueling-consistency',
        type: 'nutrition',
        priority: 'medium',
        title: 'Refueling Consistency 🏃‍♂️',
        message: 'Hitting carb and protein targets on training days.',
        recommendation: 'Excellent! Consistent post-workout nutrition supports optimal recovery and adaptation.',
        data: { carbsToday: Math.round(todayStats.carbs), proteinToday: Math.round(todayStats.protein), hadWorkout: true },
        created_at: new Date().toISOString()
      })
    }

    // 22. Rest Day Adjustments - naturally lower calorie intake detected on recovery days
    if (!hadWorkout && todayStats.calories < avgCalories * 0.9 && avgCalories > 0) {
      insights.push({
        id: 'nutrition-rest-day-adjustments',
        type: 'nutrition',
        priority: 'medium',
        title: 'Rest Day Adjustments 💤',
        message: `Lower calorie intake detected on rest day (${Math.round(todayStats.calories)} vs ${Math.round(avgCalories)} average).`,
        recommendation: 'Smart adjustment! Rest days are perfect for slightly lower intake to support recovery.',
        data: { todayCalories: Math.round(todayStats.calories), averageCalories: Math.round(avgCalories) },
        created_at: new Date().toISOString()
      })
    }

    // 23. Training Without Fuel - workout logged but <200 kcal consumed pre-session
    // This would require analyzing meal timing vs workout timing
    if (hadWorkout && todayStats.calories < 500) {
      insights.push({
        id: 'nutrition-training-without-fuel',
        type: 'nutrition',
        priority: 'medium',
        title: 'Training Without Fuel ⚠️',
        message: 'Workout logged but calorie intake is low today.',
        recommendation: 'Consider fueling before training sessions for optimal performance and recovery.',
        data: { caloriesToday: Math.round(todayStats.calories), hadWorkout: true },
        created_at: new Date().toISOString()
      })
    }

    // 24. Recovery Nutrition Masterclass - protein + carbs within 1 hour of workout 3 days in a row
    if (hadWorkout && todayStats.protein >= proteinGoal * 0.6) {
      insights.push({
        id: 'nutrition-recovery-masterclass',
        type: 'nutrition',
        priority: 'medium',
        title: 'Recovery Nutrition Masterclass 🥑',
        message: 'Protein intake detected after workout session.',
        recommendation: 'Excellent recovery nutrition! Combining protein with carbs supports optimal muscle repair.',
        data: { proteinToday: Math.round(todayStats.protein), hadWorkout: true },
        created_at: new Date().toISOString()
      })
    }

    // 26. Consistent Logger - logged at least one meal 10 consecutive days
    if (mealStreak >= 10) {
      insights.push({
        id: 'nutrition-consistent-logger',
        type: 'nutrition',
        priority: 'medium',
        title: 'Consistent Logger 🗓️',
        message: `You've logged meals for ${mealStreak} consecutive days!`,
        recommendation: 'Outstanding consistency! This habit will lead to better awareness and results.',
        data: { streakDays: mealStreak },
        created_at: new Date().toISOString()
      })
    }

    // 27. Nutrition Break - no meals logged for 48 hours
    if (todayStats.meals === 0 && currentHour >= 12) {
      insights.push({
        id: 'nutrition-break',
        type: 'nutrition',
        priority: 'medium',
        title: 'Nutrition Break ⚠️',
        message: 'No meals logged today - taking a break from tracking?',
        recommendation: 'Remember that consistent tracking leads to better awareness. Consider logging your next meal.',
        created_at: new Date().toISOString()
      })
    }

    // 28. Craving Control Success - no high-sugar snacks in the last 3 days
    // This would require analyzing food content - simplified version
    if (todayStats.meals >= 2 && todayStats.carbs < todayStats.protein * 3) {
      insights.push({
        id: 'nutrition-craving-control',
        type: 'nutrition',
        priority: 'medium',
        title: 'Craving Control Success 🙌',
        message: 'Balanced carb-to-protein ratio suggests good craving management.',
        recommendation: 'Great job managing cravings! Continue prioritizing protein and complex carbs.',
        data: { carbToProteinRatio: Math.round(todayStats.carbs / Math.max(1, todayStats.protein)) },
        created_at: new Date().toISOString()
      })
    }

    // ==================== LOW PRIORITY INSIGHTS ====================

    // 🟢 Motivational & Behavioral Nudges

    // Additional Low Priority Insights from comprehensive list

    // 29. Perfect Macro Balance - within ±5% of macro targets
    const calorieTarget = calorieGoal
    const proteinTargetPercent = (proteinGoal * 4 / calorieTarget) * 100
    const carbTargetPercent = (carbGoal * 4 / calorieTarget) * 100
    const fatTargetPercent = ((calorieTarget - proteinGoal * 4 - carbGoal * 4) / 9 / calorieTarget) * 100

    const macroBalance = Math.abs(proteinPercent - proteinTargetPercent) <= 5 &&
                        Math.abs(carbPercent - carbTargetPercent) <= 5 &&
                        Math.abs(fatPercent - fatTargetPercent) <= 5

    if (macroBalance && todayStats.calories > 0) {
      insights.push({
        id: 'nutrition-perfect-macro-balance',
        type: 'nutrition',
        priority: 'low',
        title: 'Perfect Macro Balance 🎯',
        message: 'Your macronutrient ratios are within ±5% of targets!',
        recommendation: 'Outstanding balance! This precision supports optimal body composition and performance.',
        data: { proteinPercent: Math.round(proteinPercent), carbPercent: Math.round(carbPercent), fatPercent: Math.round(fatPercent) },
        created_at: new Date().toISOString()
      })
    }

    // 30. Smart Recovery - protein + carbs logged after every training session this week
    if (hadWorkout && todayStats.protein >= proteinGoal * 0.5) {
      insights.push({
        id: 'nutrition-smart-recovery',
        type: 'nutrition',
        priority: 'low',
        title: 'Smart Recovery 🧠',
        message: 'Recovery nutrition detected after training session.',
        recommendation: 'Excellent! Post-workout protein supports optimal muscle repair and adaptation.',
        data: { proteinToday: Math.round(todayStats.protein), hadWorkout: true },
        created_at: new Date().toISOString()
      })
    }

    // 31. You're on a Roll - hit calorie target 3+ consecutive days
    // This would require tracking consecutive days - simplified version
    if (calorieProgress >= 95) {
      insights.push({
        id: 'nutrition-on-a-roll',
        type: 'nutrition',
        priority: 'low',
        title: 'You\'re on a Roll 🔥',
        message: `You've hit ${Math.round(calorieProgress)}% of your calorie target!`,
        recommendation: 'Keep the momentum going! Consistency is key to reaching your goals.',
        data: { progress: Math.round(calorieProgress) },
        created_at: new Date().toISOString()
      })
    }

    // 32. Balanced Plate - protein, complex carbs, and veggies logged in the same meal
    if (todayStats.meals >= 2 && todayStats.protein > 0 && todayStats.carbs > 0 && todayStats.fiber > 0) {
      insights.push({
        id: 'nutrition-balanced-plate',
        type: 'nutrition',
        priority: 'low',
        title: 'Balanced Plate 🌈',
        message: 'Protein, carbs, and fiber detected in your meals today.',
        recommendation: 'Great job creating balanced meals! This combination supports sustained energy and nutrient absorption.',
        data: { protein: Math.round(todayStats.protein), carbs: Math.round(todayStats.carbs), fiber: Math.round(todayStats.fiber) },
        created_at: new Date().toISOString()
      })
    }

    // 33. Micronutrient Momentum - 5+ unique vitamins/minerals on target
    if (todayStats.meals >= 3) {
      insights.push({
        id: 'nutrition-micronutrient-momentum',
        type: 'nutrition',
        priority: 'low',
        title: 'Micronutrient Momentum 🌿',
        message: `You've logged ${todayStats.meals} meals today, suggesting good micronutrient variety.`,
        recommendation: 'Continue including diverse fruits, vegetables, and whole foods for comprehensive nutrient coverage.',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // 34. Mindful Eating Moment - prompt reflection after logging a meal >800 kcal
    const largeMeals = todayMeals?.filter(meal => (meal.total_calories || 0) > 800) || []
    if (largeMeals.length > 0) {
      insights.push({
        id: 'nutrition-mindful-eating',
        type: 'nutrition',
        priority: 'low',
        title: 'Mindful Eating Moment 🧘',
        message: 'Large meal detected. How do you feel?',
        recommendation: 'Take a moment to check in with your hunger and fullness cues. Mindful eating enhances satisfaction and digestion.',
        data: { largeMeals: largeMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // 35. Weekend Reset - suggest meal prep if weekend logs show inconsistency
    if (todayDay === 6 || todayDay === 0) { // Saturday or Sunday
      insights.push({
        id: 'nutrition-weekend-reset',
        type: 'nutrition',
        priority: 'low',
        title: 'Weekend Reset 🧺',
        message: 'Weekend meal prep opportunity!',
        recommendation: 'Consider preparing some healthy meals and snacks for the upcoming week to maintain consistency.',
        created_at: new Date().toISOString()
      })
    }

    // 36. New Food Explorer - 5+ new foods tried this week
    // This would require tracking new foods - simplified version
    if (todayStats.meals >= 3) {
      insights.push({
        id: 'nutrition-new-food-explorer',
        type: 'nutrition',
        priority: 'low',
        title: 'New Food Explorer 🌍',
        message: 'Variety in your meals suggests culinary exploration!',
        recommendation: 'Keep trying new foods! Dietary variety supports better nutrient intake and prevents boredom.',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // 37. Cooking Streak - 3+ home-cooked meals logged consecutively
    // Simplified - just check if meals logged
    if (todayStats.meals >= 3) {
      insights.push({
        id: 'nutrition-cooking-streak',
        type: 'nutrition',
        priority: 'low',
        title: 'Cooking Streak 👨‍🍳',
        message: `You've logged ${todayStats.meals} meals today!`,
        recommendation: 'Home cooking gives you control over ingredients and portions. Keep up the great work!',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // 38. Nourishment Wins - overall nutrient density up compared to last week
    if (avgCalories > 0 && todayStats.calories > avgCalories * 0.9) {
      insights.push({
        id: 'nutrition-nourishment-wins',
        type: 'nutrition',
        priority: 'low',
        title: 'Nourishment Wins 🏆',
        message: 'Your nutrient intake is on track compared to recent averages.',
        recommendation: 'Keep prioritizing nutrient-dense foods for optimal health and performance.',
        data: { todayCalories: Math.round(todayStats.calories), averageCalories: Math.round(avgCalories) },
        created_at: new Date().toISOString()
      })
    }

    // 39. Meal Logging Streak - 7+ consecutive days of complete tracking
    if (mealStreak >= 7) {
      insights.push({
        id: 'nutrition-meal-logging-streak',
        type: 'nutrition',
        priority: 'low',
        title: 'Meal Logging Streak 🔁',
        message: `You've maintained complete tracking for ${mealStreak} days!`,
        recommendation: 'Outstanding commitment! This consistency will lead to better results and awareness.',
        data: { streakDays: mealStreak },
        created_at: new Date().toISOString()
      })
    }

    // 40. Mindful Hydration - multiple small hydration entries throughout the day
    if (totalHydration >= 1500) {
      insights.push({
        id: 'nutrition-mindful-hydration',
        type: 'nutrition',
        priority: 'low',
        title: 'Mindful Hydration 💦',
        message: `You've consumed ${totalHydration}ml of water today.`,
        recommendation: 'Excellent hydration habits! Consistent water intake supports all bodily functions.',
        data: { hydrationToday: totalHydration },
        created_at: new Date().toISOString()
      })
    }

    // 41. Morning Nutrition Wins - breakfast logged before 9 AM for 5 consecutive days
    const breakfastMeals = todayMeals?.filter(meal => {
      if (!meal.created_at) return false
      const mealTime = new Date(meal.created_at).getHours()
      return mealTime < 9 // Before 9 AM
    }) || []

    if (breakfastMeals.length > 0) {
      insights.push({
        id: 'nutrition-morning-wins',
        type: 'nutrition',
        priority: 'low',
        title: 'Morning Nutrition Wins 🌅',
        message: 'Breakfast logged early in the day!',
        recommendation: 'Starting your day with fuel supports metabolism and sustained energy. Great habit!',
        data: { breakfastMeals: breakfastMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // 42. Sustainable Habits - total calorie variance <10% for the past week
    const recentCalories = Object.values(dailyAverages).slice(-7) as number[]
    const calorieVariance = recentCalories.length > 1 ?
      Math.max(...recentCalories) - Math.min(...recentCalories) : 0
    const avgRecentCalories = recentCalories.reduce((sum: number, cal: number) => sum + cal, 0) / recentCalories.length
    const variancePercent = avgRecentCalories > 0 ? (calorieVariance / avgRecentCalories) * 100 : 0

    if (variancePercent < 10 && recentCalories.length >= 3) {
      insights.push({
        id: 'nutrition-sustainable-habits',
        type: 'nutrition',
        priority: 'low',
        title: 'Sustainable Habits 🌿',
        message: `Your calorie intake has been consistent (variance: ${Math.round(variancePercent)}%).`,
        recommendation: 'Stable eating patterns support metabolic health and sustainable results. Well done!',
        data: { variancePercent: Math.round(variancePercent) },
        created_at: new Date().toISOString()
      })
    }

    // 43. Balanced Lifestyle - exercise, nutrition, and hydration logs all active today
    if (hadWorkout && todayStats.meals > 0 && totalHydration >= 1000) {
      insights.push({
        id: 'nutrition-balanced-lifestyle',
        type: 'nutrition',
        priority: 'low',
        title: 'Balanced Lifestyle ⚖️',
        message: 'Exercise, nutrition, and hydration all logged today!',
        recommendation: 'Perfect balance! This holistic approach supports optimal health and performance.',
        data: { hadWorkout: true, mealsToday: todayStats.meals, hydrationToday: totalHydration },
        created_at: new Date().toISOString()
      })
    }

    // Existing low priority insights
    if (mealStreak >= 5) {
      insights.push({
        id: 'nutrition-consistency-streak',
        type: 'nutrition',
        priority: 'low',
        title: 'Consistency Streak 🔥',
        message: `You've logged meals for ${mealStreak} days in a row!`,
        recommendation: 'Amazing dedication! Consistent tracking leads to better awareness and results.',
        data: { streakDays: mealStreak },
        created_at: new Date().toISOString()
      })
    }

    // 17. Hydration Hero - met water goal 3+ days in a row
    if (hydrationStreak >= 3) {
      insights.push({
        id: 'nutrition-hydration-hero',
        type: 'nutrition',
        priority: 'low',
        title: 'Hydration Hero 💧',
        message: `You've met your hydration goal for ${hydrationStreak} days in a row!`,
        recommendation: 'Stay hydrated! Your body and performance thank you.',
        data: { streakDays: hydrationStreak },
        created_at: new Date().toISOString()
      })
    }

    // 18. Colorful Plate Challenge - encourage more fruit/vegetable diversity
    if (todayStats.fiber < 25 && todayStats.meals > 0) {
      insights.push({
        id: 'nutrition-colorful-plate',
        type: 'nutrition',
        priority: 'low',
        title: 'Colorful Plate Challenge 🌈',
        message: 'Consider adding more colorful fruits and vegetables to your meals.',
        recommendation: 'Aim for a rainbow of colors on your plate - different colored produce provides different micronutrients!',
        data: { fiberToday: Math.round(todayStats.fiber) },
        created_at: new Date().toISOString()
      })
    }

    // 19. Smart Snack Swap - high-sugar snack logged
    // This would require analyzing individual foods - simplified version
    if (todayStats.carbs > todayStats.protein * 2 && todayStats.meals >= 2) {
      insights.push({
        id: 'nutrition-smart-snack-swap',
        type: 'nutrition',
        priority: 'low',
        title: 'Smart Snack Swap 🍎',
        message: 'Consider pairing high-carb snacks with protein for better blood sugar control.',
        recommendation: 'Try adding nuts, cheese, or Greek yogurt to your fruit or grain-based snacks.',
        data: { carbToProteinRatio: Math.round(todayStats.carbs / Math.max(1, todayStats.protein)) },
        created_at: new Date().toISOString()
      })
    }

    // 20. Mindful Moment - late-night eating pattern
    const lateNightMeals = todayMeals?.filter(meal => {
      if (!meal.meal_time) return false
      const hour = parseInt(meal.meal_time.split(':')[0])
      return hour >= 21 // After 9 PM
    }) || []

    if (lateNightMeals.length > 0) {
      insights.push({
        id: 'nutrition-mindful-moment',
        type: 'nutrition',
        priority: 'low',
        title: 'Mindful Moment 🧘',
        message: 'Late-night eating detected. How are you feeling?',
        recommendation: 'Consider why you\'re eating now. Are you truly hungry, or is it stress/emotional eating? Listen to your body\'s signals.',
        data: { lateNightMeals: lateNightMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // 21. Weekend Prep Reminder
    if (todayDay === 6) { // Saturday
      insights.push({
        id: 'nutrition-weekend-prep',
        type: 'nutrition',
        priority: 'low',
        title: 'Weekend Prep Reminder 🧺',
        message: 'Sunday is a great day for meal prep and planning.',
        recommendation: 'Prepare some healthy meals and snacks for the week ahead to maintain consistency.',
        created_at: new Date().toISOString()
      })
    }

    // 22. Body Feedback Needed
    if (todayStats.meals === 0 && currentHour >= 12) {
      insights.push({
        id: 'nutrition-body-feedback',
        type: 'nutrition',
        priority: 'low',
        title: 'Body Feedback Needed 🧠',
        message: 'How is your energy level today?',
        recommendation: 'Take a moment to check in with your body. Log how you\'re feeling - this awareness helps optimize your nutrition.',
        created_at: new Date().toISOString()
      })
    }

    // 23. Perfect Hydration Day
    if (totalHydration >= 2000) {
      insights.push({
        id: 'nutrition-perfect-hydration',
        type: 'nutrition',
        priority: 'low',
        title: 'Perfect Hydration Day 💦',
        message: `You've reached ${totalHydration}ml today - excellent hydration!`,
        recommendation: 'Keep it up! Proper hydration supports all bodily functions and performance.',
        data: { hydrationToday: totalHydration },
        created_at: new Date().toISOString()
      })
    }

    // 24. Great Recovery Nutrition
    if (hadWorkout && todayStats.protein >= proteinGoal * 0.7) {
      insights.push({
        id: 'nutrition-great-recovery',
        type: 'nutrition',
        priority: 'low',
        title: 'Great Recovery Nutrition 🥤',
        message: 'Post-workout protein intake detected within 1 hour of training.',
        recommendation: 'Excellent! Protein timing supports optimal muscle recovery and adaptation.',
        data: { proteinToday: Math.round(todayStats.protein), hadWorkout: true },
        created_at: new Date().toISOString()
      })
    }

    // 25. Sleep & Nutrition Sync
    if (lateNightMeals.length > 0) {
      insights.push({
        id: 'nutrition-sleep-sync',
        type: 'nutrition',
        priority: 'low',
        title: 'Sleep & Nutrition Sync 🌙',
        message: 'Late eating may affect sleep quality.',
        recommendation: 'Try to finish eating 2-3 hours before bedtime to support better sleep and recovery.',
        data: { lateNightMeals: lateNightMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // ==================== ADVANCED CONTEXTUAL INSIGHTS ====================

    // 🧠 Next-Gen AI Behavior

    // Sleep & Energy Integration
    // Note: These would require sleep tracking integration
    if (todayStats.calories < avgCalories * 0.9 && avgCalories > 0) {
      insights.push({
        id: 'nutrition-sleep-energy-integration',
        type: 'nutrition',
        priority: 'low',
        title: 'Energy Pattern Detected 😴',
        message: 'Lower calorie intake detected - check sleep quality and energy levels.',
        recommendation: 'If you\'re experiencing fatigue, consider sleep quality and adjust nutrition timing accordingly.',
        data: { todayCalories: Math.round(todayStats.calories), averageCalories: Math.round(avgCalories) },
        created_at: new Date().toISOString()
      })
    }

    // Caffeine Compensation Alert
    if (totalCaffeine > 300) {
      insights.push({
        id: 'nutrition-caffeine-compensation',
        type: 'nutrition',
        priority: 'medium',
        title: 'Caffeine Pattern ☕️',
        message: `You've consumed ${totalCaffeine}mg of caffeine today.`,
        recommendation: 'High caffeine intake detected. Ensure adequate hydration and consider timing for optimal sleep.',
        data: { caffeineToday: totalCaffeine },
        created_at: new Date().toISOString()
      })
    }

    // Sleep Supportive Nutrition
    if (lateNightMeals.length > 0) {
      insights.push({
        id: 'nutrition-sleep-supportive',
        type: 'nutrition',
        priority: 'low',
        title: 'Sleep Supportive Nutrition 🌙',
        message: 'Late eating detected.',
        recommendation: 'Consider magnesium-rich foods earlier in the day to support better sleep quality.',
        data: { lateMeals: lateNightMeals.length },
        created_at: new Date().toISOString()
      })
    }

    // Mood & Cognitive Correlation
    if (todayStats.meals === 0 && currentHour >= 14) {
      insights.push({
        id: 'nutrition-mood-correlation',
        type: 'nutrition',
        priority: 'medium',
        title: 'Mood & Energy Check 💭',
        message: 'No meals logged today - how are you feeling?',
        recommendation: 'Hunger can affect mood and cognitive function. Consider logging your current state and having a balanced meal.',
        created_at: new Date().toISOString()
      })
    }

    // Stress-Eating Detected
    if (eveningCaloriePercent > 30 && todayStats.calories > 0) {
      insights.push({
        id: 'nutrition-stress-eating',
        type: 'nutrition',
        priority: 'low',
        title: 'Evening Calorie Pattern 😬',
        message: `${Math.round(eveningCaloriePercent)}% of calories consumed in the evening.`,
        recommendation: 'High evening intake detected. If this is stress-related, consider mindful eating practices.',
        data: { eveningPercent: Math.round(eveningCaloriePercent) },
        created_at: new Date().toISOString()
      })
    }

    // Focus Foods
    if (todayStats.fiber >= 20) {
      insights.push({
        id: 'nutrition-focus-foods',
        type: 'nutrition',
        priority: 'low',
        title: 'Brain Health Focus 🧠',
        message: `Good fiber intake (${Math.round(todayStats.fiber)}g) suggests nutrient-dense eating.`,
        recommendation: 'Continue including brain-supportive foods like fatty fish, nuts, and colorful vegetables.',
        data: { fiberToday: Math.round(todayStats.fiber) },
        created_at: new Date().toISOString()
      })
    }

    // Long-Term Trends
    if (mealStreak >= 14) {
      insights.push({
        id: 'nutrition-consistency-champion',
        type: 'nutrition',
        priority: 'low',
        title: 'Consistency Champion 🥇',
        message: `You've logged meals for ${mealStreak} consecutive days!`,
        recommendation: 'Outstanding long-term commitment! This consistency will yield significant results.',
        data: { streakDays: mealStreak },
        created_at: new Date().toISOString()
      })
    }

    // Positive Trend
    if (todayStats.protein > avgProtein * 1.1 && avgProtein > 0) {
      insights.push({
        id: 'nutrition-positive-trend',
        type: 'nutrition',
        priority: 'low',
        title: 'Positive Trend 📈',
        message: `Protein intake (${Math.round(todayStats.protein)}g) above recent average (${Math.round(avgProtein)}g).`,
        recommendation: 'Great upward trend in protein consumption! Keep prioritizing complete proteins.',
        data: { todayProtein: Math.round(todayStats.protein), averageProtein: Math.round(avgProtein) },
        created_at: new Date().toISOString()
      })
    }

    // Recovery Readiness Improving
    if (hadWorkout && todayStats.protein >= proteinGoal * 0.8) {
      insights.push({
        id: 'nutrition-recovery-improving',
        type: 'nutrition',
        priority: 'low',
        title: 'Recovery Readiness 💪',
        message: 'Strong post-workout protein intake detected.',
        recommendation: 'Excellent recovery nutrition! Your body is well-prepared for training demands.',
        data: { proteinToday: Math.round(todayStats.protein), hadWorkout: true },
        created_at: new Date().toISOString()
      })
    }

    // Sustainable Weight Trend
    if (variancePercent < 15 && recentCalories.length >= 5) {
      insights.push({
        id: 'nutrition-sustainable-weight-trend',
        type: 'nutrition',
        priority: 'low',
        title: 'Sustainable Pattern ⚖️',
        message: `Calorie intake variance: ${Math.round(variancePercent)}% over past week.`,
        recommendation: 'Consistent intake patterns support sustainable progress. Maintain this stability!',
        data: { variancePercent: Math.round(variancePercent) },
        created_at: new Date().toISOString()
      })
    }

    // Micronutrient Diversity
    if (todayStats.meals >= 4) {
      insights.push({
        id: 'nutrition-micronutrient-diversity',
        type: 'nutrition',
        priority: 'low',
        title: 'Micronutrient Diversity 🌿',
        message: `You've logged ${todayStats.meals} meals today!`,
        recommendation: 'Multiple meals suggest good variety. Continue exploring different fruits, vegetables, and whole foods.',
        data: { mealsToday: todayStats.meals },
        created_at: new Date().toISOString()
      })
    }

    // ==================== LEGACY INSIGHTS (keep for compatibility) ====================

    // Keep some of the original insights if no high-priority ones were triggered
    if (insights.length === 0) {
      // Original calorie tracking insight
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
        }
      }

      // Protein intake insight
      if (todayStats.protein > 0 && proteinProgress < 50) {
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
      }

      // Meal timing insight
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
      }

      // Hydration reminder
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

      // No substantial meals logged today (early day or very low intake)
      if ((todayStats.meals === 0 && currentHour < 10) || (todayStats.calories < 200 && currentHour < 12)) {
        insights.push({
          id: 'nutrition-start-day',
          type: 'nutrition',
          priority: 'high',
          title: 'Start Your Nutrition Day 🌅',
          message: todayStats.calories < 200 && todayStats.meals > 0
            ? 'You\'ve logged some snacks but haven\'t started your main nutrition yet.'
            : 'You haven\'t logged any meals yet today.',
          recommendation: 'Begin with a balanced breakfast or meal containing protein, complex carbs, and healthy fats to fuel your day.',
          created_at: new Date().toISOString()
        })
      }
    }

    // Sort insights by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    // Limit to top 5 insights to avoid overwhelming the user
    return insights.slice(0, 5)

  } catch (error) {
    console.error('Error generating nutrition insights:', error)
    return []
  }
}
