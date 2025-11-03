import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import dynamicImport from 'next/dynamic'
import { Suspense } from 'react'
import SkeletonLoader from '@/components/SkeletonLoader'
import { ToastProvider } from '@/components/Toast'
import { getDailyCaffeineTotal } from '@/lib/fitness-data'

export const dynamic = 'force-dynamic'

// Dynamically import the heavy NutritionClient component
const NutritionClient = dynamicImport(() => import('../../components/features/nutrition/NutritionClient'), {
  loading: () => <SkeletonLoader type="nutrition" />
})

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
    // Get meals for the current week (Monday to Sunday) with food items
    (() => {
      const today = new Date()
      const monday = new Date(today)
      // Calculate Monday of current week (or previous week if today is Sunday)
      const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      if (dayOfWeek === 0) {
        // If today is Sunday, get Monday of previous week
        monday.setDate(today.getDate() - 6)
      } else {
        // Otherwise, get Monday of current week
        monday.setDate(today.getDate() - dayOfWeek + 1)
      }
      
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

      return supabase.from('meals').select(`
        *,
        meal_items (
          id,
          quantity,
          food_item:food_items (
            id,
            name,
            brand,
            serving_size,
            serving_unit
          )
        )
      `)
        .eq('user_id', user.id)
        .order('meal_date', { ascending: false })
        .limit(50)
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
      // Calculate Monday of current week (or previous week if today is Sunday)
      const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      if (dayOfWeek === 0) {
        // If today is Sunday, get Monday of previous week
        monday.setDate(today.getDate() - 6)
      } else {
        // Otherwise, get Monday of current week
        monday.setDate(today.getDate() - dayOfWeek + 1)
      }
      monday.setHours(0, 0, 0, 0)
      
      return supabase.from('hydration_logs').select('*')
        .gte('logged_time', monday.toISOString())
        .order('logged_time', { ascending: false })
    })(),
    // Caffeine data for the current week
    (() => {
      const today = new Date()
      const monday = new Date(today)
      // Calculate Monday of current week (or previous week if today is Sunday)
      const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      if (dayOfWeek === 0) {
        // If today is Sunday, get Monday of previous week
        monday.setDate(today.getDate() - 6)
      } else {
        // Otherwise, get Monday of current week
        monday.setDate(today.getDate() - dayOfWeek + 1)
      }
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

  // Process meals data to include food items in the expected format
  const processedMeals = (meals || []).map((meal: any) => ({
    ...meal,
    food_items: (meal.meal_items || []).map((item: any) => ({
      id: item.food_item?.id || '',
      name: item.food_item?.name || 'Unknown Food',
      brand: item.food_item?.brand || undefined,
      quantity: item.quantity || 1,
      serving_size: item.food_item?.serving_size || 0,
      serving_unit: item.food_item?.serving_unit || 'g'
    }))
  }))

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
  const dailyCaffeineTotal = await getDailyCaffeineTotal(today)

  return (
    <ToastProvider>
      <Suspense fallback={<SkeletonLoader type="nutrition" />}>
        <NutritionClient
          initialData={{
            foodItems: foodItems || [],
            meals: processedMeals || [],
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
      </Suspense>
    </ToastProvider>
  )
}
