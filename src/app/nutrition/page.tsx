import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
// Update the import path to match the actual location of NutritionClient
import NutritionClient from '../../components/NutritionClient'

export default async function NutritionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial data for the nutrition page
  const [
    { data: foodItems },
    { data: meals },
    { data: nutritionGoals },
    { data: mealTemplates },
    { data: savedFoods },
    { data: dailyNutritionStats },
    { data: hydrationLogs },
    { data: caffeineLogs },
    { data: micronutrients },
    { data: userInsights },
    { data: habitPatterns },
    { data: metricCorrelations }
  ] = await Promise.all([
    supabase.from('food_items').select('*').order('name'),
    // Get meals for the current week (Monday to Sunday)
    (() => {
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1) // Monday of current week
      
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6) // Sunday of current week
      
      // Use local date strings instead of UTC
      const mondayStr = (() => {
        const year = monday.getFullYear()
        const month = String(monday.getMonth() + 1).padStart(2, '0')
        const day = String(monday.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
      
      const sundayStr = (() => {
        const year = sunday.getFullYear()
        const month = String(sunday.getMonth() + 1).padStart(2, '0')
        const day = String(sunday.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
      
      return supabase.from('meals').select('*')
        .gte('meal_date', mondayStr)
        .lte('meal_date', sundayStr)
        .order('meal_date', { ascending: false })
    })(),
    supabase.from('nutrition_goals').select('*').eq('is_active', true),
    supabase.from('meal_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('saved_foods').select(`
      *,
      food_item:food_items(*)
    `).eq('user_id', user.id).order('created_at', { ascending: false }),
    // Calculate daily nutrition stats
    supabase.from('meals')
      .select('total_calories, total_protein, total_carbs, total_fat, total_fiber')
      .eq('meal_date', (() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()),
    // Hydration data for the current week
    (() => {
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1) // Monday of current week
      monday.setHours(0, 0, 0, 0)
      
      return supabase.from('hydration_logs').select('*')
        .gte('logged_time', monday.toISOString())
        .order('logged_time', { ascending: false })
    })(),
    // Caffeine data for the current week
    (() => {
      const today = new Date()
      const monday = new Date(today)
      monday.setDate(today.getDate() - today.getDay() + 1) // Monday of current week
      monday.setHours(0, 0, 0, 0)
      
      return supabase.from('caffeine_logs').select('*')
        .gte('logged_time', monday.toISOString())
        .order('logged_time', { ascending: false })
    })(),
    // Micronutrients data
    supabase.from('micronutrients').select('*').order('nutrient_category', { ascending: true }).order('nutrient_name', { ascending: true }),
    // User insights
    supabase.from('user_insights').select('*').order('created_at', { ascending: false }).limit(10),
    // Habit patterns
    supabase.from('habit_patterns').select('*').eq('is_active', true).order('frequency_score', { ascending: false }),
    // Metric correlations
    supabase.from('metric_correlations').select('*').eq('is_significant', true).order('correlation_coefficient', { ascending: false })
  ])

  // Calculate daily stats
  const dailyStats = (dailyNutritionStats || []).reduce(
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

  // Calculate daily hydration and caffeine totals
  const today = (() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()
  const dailyHydrationTotal = (hydrationLogs || [])
    .filter(log => log.logged_time.startsWith(today))
    .reduce((total, log) => total + log.amount_ml, 0)
  const dailyCaffeineTotal = (caffeineLogs || [])
    .filter(log => log.logged_time.startsWith(today))
    .reduce((total, log) => total + log.amount_mg, 0)

  return (
    <NutritionClient
      initialData={{
        foodItems: foodItems || [],
        meals: meals || [],
        nutritionGoals: nutritionGoals || [],
        mealTemplates: mealTemplates || [],
        savedFoods: savedFoods || [],
        dailyNutritionStats: dailyStats,
        hydrationLogs: hydrationLogs || [],
        caffeineLogs: caffeineLogs || [],
        micronutrients: micronutrients || [],
        userInsights: userInsights || [],
        habitPatterns: habitPatterns || [],
        metricCorrelations: metricCorrelations || [],
        dailyHydrationTotal,
        dailyCaffeineTotal
      }}
    />
  )
}
