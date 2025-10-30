import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
// Update the import path to match the actual location of NutritionClient
import NutritionClient from '../../components/NutritionClient'

export default async function NutritionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch initial data for the nutrition page
  const [
    { data: foodItems },
    { data: meals },
    { data: nutritionGoals },
    { data: mealTemplates },
    { data: dailyNutritionStats },
    { data: hydrationLogs },
    { data: caffeineLogs },
    { data: micronutrients },
    { data: userInsights },
    { data: habitPatterns },
    { data: metricCorrelations }
  ] = await Promise.all([
    supabase.from('food_items').select('*').order('name'),
    supabase.from('meals').select('*').order('meal_date', { ascending: false }).limit(10),
    supabase.from('nutrition_goals').select('*').eq('is_active', true),
    supabase.from('meal_templates').select('*').order('created_at', { ascending: false }),
    // Calculate daily nutrition stats
    supabase.from('meals')
      .select('total_calories, total_protein, total_carbs, total_fat, total_fiber')
      .eq('meal_date', new Date().toISOString().split('T')[0]),
    // Hydration data for today
    supabase.from('hydration_logs').select('*')
      .gte('logged_time', new Date().toISOString().split('T')[0])
      .order('logged_time', { ascending: false }).limit(10),
    // Caffeine data for today
    supabase.from('caffeine_logs').select('*')
      .gte('logged_time', new Date().toISOString().split('T')[0])
      .order('logged_time', { ascending: false }).limit(10),
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

  return (
    <NutritionClient
      initialData={{
        foodItems: foodItems || [],
        meals: meals || [],
        nutritionGoals: nutritionGoals || [],
        mealTemplates: mealTemplates || [],
        dailyNutritionStats: dailyStats,
        hydrationLogs: hydrationLogs || [],
        caffeineLogs: caffeineLogs || [],
        micronutrients: micronutrients || [],
        userInsights: userInsights || [],
        habitPatterns: habitPatterns || [],
        metricCorrelations: metricCorrelations || []
      }}
    />
  )
}
