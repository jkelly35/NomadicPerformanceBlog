'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import FoodSearch from "@/components/FoodSearch";
import NutritionFacts from "@/components/NutritionFacts";
import { FoodItem as USDAFoodItem } from "@/lib/nutrition-api";
import BarcodeScanner from './BarcodeScanner';
import { BarcodeFood } from '@/lib/barcode-api';
import { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem, logMeal, deleteMeal, upsertNutritionGoal, createMealTemplate, updateMealTemplate, deleteMealTemplate, logMealFromTemplate, getMealTemplateWithItems, FoodItem, Meal, MealTemplate, MealTemplateItem, NutritionGoal, logHydration, getHydrationLogs, getDailyHydrationTotal, logCaffeine, getCaffeineLogs, getDailyCaffeineTotal, getMicronutrients, getFoodMicronutrients, getUserInsights, markInsightAsRead, getHabitPatterns, getMetricCorrelations, HydrationLog, CaffeineLog, Micronutrient, FoodMicronutrient, UserInsight, HabitPattern, MetricCorrelation, generateWeeklyInsights, getSavedFoods, saveFood, removeSavedFood, SavedFood, getDailyMicronutrientIntake } from '@/lib/fitness-data'

interface NutritionData {
  foodItems: FoodItem[]
  meals: Meal[]
  nutritionGoals: NutritionGoal[]
  mealTemplates: MealTemplate[]
  savedFoods: SavedFood[]
  dailyNutritionStats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }
  hydrationLogs: HydrationLog[]
  caffeineLogs: CaffeineLog[]
  micronutrients: Micronutrient[]
  userInsights: UserInsight[]
  habitPatterns: HabitPattern[]
  metricCorrelations: MetricCorrelation[]
  dailyHydrationTotal?: number
  dailyCaffeineTotal?: number
}

interface NutritionClientProps {
  initialData: NutritionData
}

export default function NutritionClient({ initialData }: NutritionClientProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<NutritionData>(initialData)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'foods' | 'usda-search' | 'barcode-scan' | 'meals' | 'templates' | 'saved' | 'log' | 'goals' | 'ai-insights'>('dashboard')
  const [aiInsightsSubTab, setAiInsightsSubTab] = useState<'insights' | 'habits' | 'correlations'>('insights')
  const [selectedUSDAFood, setSelectedUSDAFood] = useState<USDAFoodItem | null>(null)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [selectedBarcodeFood, setSelectedBarcodeFood] = useState<BarcodeFood | null>(null)

  // Refresh data function
  const refreshNutritionData = async () => {
    try {
      // Fetch fresh data from server
      const [mealsResult, hydrationResult, caffeineResult] = await Promise.all([
        // Note: We don't have a direct getMeals function, so we'll rely on router.refresh for now
        // In a full implementation, you'd fetch fresh meals data here
        Promise.resolve(null),
        getHydrationLogs(),
        getCaffeineLogs()
      ])

      // Update hydration and caffeine logs if we got fresh data
      if (hydrationResult) {
        setHydrationLogs(hydrationResult)
        // Recalculate daily hydration total
        const today = (() => {
          const d = new Date()
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        })()
        const todayHydration = hydrationResult
          .filter(log => log.logged_time.startsWith(today))
          .reduce((sum, log) => sum + (log.amount_ml || 0), 0)
        setDailyHydrationTotal(todayHydration)
      }

      if (caffeineResult) {
        setCaffeineLogs(caffeineResult)
        // Recalculate daily caffeine total
        const today = (() => {
          const d = new Date()
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        })()
        const todayCaffeine = caffeineResult
          .filter(log => log.logged_time.startsWith(today))
          .reduce((sum, log) => sum + (log.amount_mg || 0), 0)
        setDailyCaffeineTotal(todayCaffeine)
      }

      // For meals, we rely on the local state updates and router.refresh
      // In a production app, you'd want a getMeals function to fetch fresh meal data
      await loadDailyMicronutrientIntake()
      router.refresh()
    } catch (error) {
      console.error('Error refreshing data:', error)
      // Fallback to page reload if something goes wrong
      window.location.reload()
    }
  }

    // Food Database state
  const [foodItems, setFoodItems] = useState<FoodItem[]>(initialData.foodItems)
  const [foodSearch, setFoodSearch] = useState('')
  const [showAddFoodForm, setShowAddFoodForm] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)

  // Meal History state
  const [meals, setMeals] = useState<any[]>(initialData.meals)
  const [mealFilter, setMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all')
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [mealsLoading, setMealsLoading] = useState(false)

  // Log Meal state
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [mealDate, setMealDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [mealTime, setMealTime] = useState('')
  const [mealNotes, setMealNotes] = useState('')
  const [selectedFoods, setSelectedFoods] = useState<Array<{food: FoodItem, quantity: number}>>([])
  const [foodSelectorOpen, setFoodSelectorOpen] = useState(false)
  const [foodSelectorSearch, setFoodSelectorSearch] = useState('')
  const [logMealLoading, setLogMealLoading] = useState(false)
  const [editingMealId, setEditingMealId] = useState<string | null>(null)
  const [goalChanges, setGoalChanges] = useState<Record<string, number>>({})
  const [savingGoals, setSavingGoals] = useState(false)

  // Meal Templates state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    description: '',
    food_items: [] as Array<{ food_item_id: string; quantity: number }>
  })

  // Hydration state
  const [hydrationLogs, setHydrationLogs] = useState<HydrationLog[]>(initialData.hydrationLogs)
  const [dailyHydrationTotal, setDailyHydrationTotal] = useState(initialData.dailyHydrationTotal || 0)

  // Caffeine state
  const [caffeineLogs, setCaffeineLogs] = useState<CaffeineLog[]>(initialData.caffeineLogs)
  const [dailyCaffeineTotal, setDailyCaffeineTotal] = useState(initialData.dailyCaffeineTotal || 0)

  // Micronutrients state
  const [micronutrients, setMicronutrients] = useState<Micronutrient[]>(initialData.micronutrients)
  const [foodMicronutrients, setFoodMicronutrients] = useState<FoodMicronutrient[]>([])
  const [dailyMicronutrientIntake, setDailyMicronutrientIntake] = useState<{ [key: string]: number }>({})

  // Insights state
  const [userInsights, setUserInsights] = useState<UserInsight[]>(initialData.userInsights)
  const [insightsLoading, setInsightsLoading] = useState(false)

  // Habit patterns state
  const [habitPatterns, setHabitPatterns] = useState<HabitPattern[]>(initialData.habitPatterns)
  const [habitsLoading, setHabitsLoading] = useState(false)

  // Correlations state
  const [metricCorrelations, setMetricCorrelations] = useState<MetricCorrelation[]>(initialData.metricCorrelations)
  const [correlationsLoading, setCorrelationsLoading] = useState(false)

  // Food selector context
  const [foodSelectorContext, setFoodSelectorContext] = useState<'meal' | 'template'>('meal')
  const [foodSelectorFilter, setFoodSelectorFilter] = useState<'database' | 'templates' | 'saved' | 'usda' | 'barcode'>('database')

  const [isLoading, setIsLoading] = useState(false)

  // Food management functions
  const loadFoodItems = async (search = '') => {
    setIsLoading(true)
    try {
      const items = await getFoodItems(search)
      setFoodItems(items)
    } catch (error) {
      console.error('Error loading food items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateFood = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await createFoodItem(formData)
      if (result.success) {
        await loadFoodItems(foodSearch)
        setShowAddFoodForm(false)
      } else {
        // Provide more user-friendly error messages
        let errorMessage = result.error || 'Failed to create food item'
        if (errorMessage.includes('duplicate key value') || errorMessage.includes('unique constraint')) {
          errorMessage = 'A food item with this name and brand already exists. Please choose a different name or brand.'
        }
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error creating food item:', error)
      alert('Failed to create food item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateFood = async (foodId: string, formData: FormData) => {
    setIsLoading(true)
    try {
      const result = await updateFoodItem(foodId, formData)
      if (result.success) {
        await loadFoodItems(foodSearch)
        setEditingFood(null)
      } else {
        alert(result.error || 'Failed to update food item')
      }
    } catch (error) {
      console.error('Error updating food item:', error)
      alert('Failed to update food item')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this food item?')) return

    setIsLoading(true)
    try {
      const result = await deleteFoodItem(foodId)
      if (result.success) {
        await loadFoodItems(foodSearch)
      } else {
        alert(result.error || 'Failed to delete food item')
      }
    } catch (error) {
      console.error('Error deleting food item:', error)
      alert('Failed to delete food item')
    } finally {
      setIsLoading(false)
    }
  }

  // Load food items when search changes
  useEffect(() => {
    if (activeTab === 'foods') {
      loadFoodItems(foodSearch)
    }
  }, [foodSearch, activeTab])

  // Meal history functions
  const loadMeals = async () => {
    setMealsLoading(true)
    try {
      // For now, we'll use the initial data. In a full implementation, you'd fetch with filters
      setMeals(initialData.meals)
    } catch (error) {
      console.error('Error loading meals:', error)
    } finally {
      setMealsLoading(false)
    }
  }

  const loadHydrationData = async () => {
    try {
      // Use local date instead of UTC to match meal logging
      const today = (() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
      const [logs, total] = await Promise.all([
        getHydrationLogs(today, today),
        getDailyHydrationTotal(today)
      ])
      setHydrationLogs(logs)
      setDailyHydrationTotal(total)
    } catch (error) {
      console.error('Error loading hydration data:', error)
    }
  }

  const loadCaffeineData = async () => {
    try {
      // Use local date instead of UTC to match meal logging
      const today = (() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
      const [logs, total] = await Promise.all([
        getCaffeineLogs(today, today),
        getDailyCaffeineTotal(today)
      ])
      setCaffeineLogs(logs)
      setDailyCaffeineTotal(total)
    } catch (error) {
      console.error('Error loading caffeine data:', error)
    }
  }

  const loadMicronutrientsData = async () => {
    try {
      const micronutrientsData = await getMicronutrients()
      setMicronutrients(micronutrientsData)
    } catch (error) {
      console.error('Error loading micronutrients data:', error)
    }
  }

  const loadDailyMicronutrientIntake = async () => {
    try {
      // Use local date instead of UTC
      const today = (() => {
        const d = new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })()
      const intake = await getDailyMicronutrientIntake(today)
      setDailyMicronutrientIntake(intake)
    } catch (error) {
      console.error('Error loading daily micronutrient intake:', error)
    }
  }

  const loadInsightsData = async () => {
    try {
      const insights = await getUserInsights()
      setUserInsights(insights)
    } catch (error) {
      console.error('Error loading insights data:', error)
    }
  }

  const loadHabitsData = async () => {
    try {
      const habits = await getHabitPatterns()
      setHabitPatterns(habits)
    } catch (error) {
      console.error('Error loading habits data:', error)
    }
  }

  const loadCorrelationsData = async () => {
    try {
      const correlations = await getMetricCorrelations()
      setMetricCorrelations(correlations)
    } catch (error) {
      console.error('Error loading correlations data:', error)
    }
  }

  // Load meals when meals tab is active
  useEffect(() => {
    if (activeTab === 'meals') {
      loadMeals()
    }
  }, [activeTab])

  // Load hydration data when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadHydrationData()
    }
  }, [activeTab])

  // Load caffeine data when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadCaffeineData()
    }
  }, [activeTab])

  // Load micronutrients data when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadMicronutrientsData()
      loadDailyMicronutrientIntake()
    }
  }, [activeTab])

  // Load insights data when insights tab is active
  useEffect(() => {
    if (activeTab === 'ai-insights' && aiInsightsSubTab === 'insights') {
      loadInsightsData()
    }
  }, [activeTab])

  // Load habits data when habits tab is active
  useEffect(() => {
    if (activeTab === 'ai-insights' && aiInsightsSubTab === 'habits') {
      loadHabitsData()
    }
  }, [activeTab])

  // Load correlations data when correlations tab is active
  useEffect(() => {
    if (activeTab === 'ai-insights' && aiInsightsSubTab === 'correlations') {
      loadCorrelationsData()
    }
  }, [activeTab])

  // Meal logging functions
  const addFoodToMeal = (food: FoodItem) => {
    setSelectedFoods(prev => [...prev, { food, quantity: food.serving_size }])
    setFoodSelectorOpen(false)
    setFoodSelectorSearch('')
  }

  const addFoodToTemplate = (food: FoodItem) => {
    setTemplateForm(prev => ({
      ...prev,
      food_items: [...prev.food_items, { food_item_id: food.id, quantity: food.serving_size }]
    }))
    setFoodSelectorOpen(false)
    setFoodSelectorSearch('')
  }

  const addMealTemplateToMeal = async (template: MealTemplate) => {
    try {
      const result = await getMealTemplateWithItems(template.id)
      if (result.template && result.items) {
        // Add all foods from the template to the meal
        const newFoods = result.items.map(item => ({
          food: item.food_item!,
          quantity: item.quantity
        }))
        setSelectedFoods(prev => [...prev, ...newFoods])
      }
      setFoodSelectorOpen(false)
      setFoodSelectorSearch('')
    } catch (error) {
      console.error('Error adding meal template to meal:', error)
      alert('Failed to add meal template')
    }
  }

  const addSavedFoodToMeal = async (savedFood: SavedFood) => {
    if (!savedFood.food_item) return

    setLogMealLoading(true)
    try {
      const mealData = new FormData()
      // Determine meal type based on current time
      const now = new Date()
      const hour = now.getHours()
      let mealType = 'snack'
      if (hour < 11) mealType = 'breakfast'
      else if (hour < 15) mealType = 'lunch'
      else if (hour < 19) mealType = 'dinner'
      // else remains 'snack' for evening

      mealData.append('meal_type', mealType)
      // Use local date instead of UTC to avoid timezone issues
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const localDate = `${year}-${month}-${day}`
      mealData.append('meal_date', localDate)
      mealData.append('meal_time', new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))

      // Add the single food item
      mealData.append('food_0', savedFood.food_item.id)
      mealData.append('quantity_0', savedFood.food_item.serving_size.toString())

      const result = await logMeal(mealData)
      if (result.success && result.data) {
        const newMeal = result.data
        // Update local data immediately
        setData(prev => {
          const updatedMeals = [newMeal, ...prev.meals]
          const today = (() => {
            const d = new Date()
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          })()
          
          // Recalculate daily nutrition stats from all meals for today
          const todayMeals = updatedMeals.filter(meal => meal.meal_date === today)
          const recalculatedStats = todayMeals.reduce(
            (acc, meal) => ({
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
          
          return {
            ...prev,
            meals: updatedMeals,
            dailyNutritionStats: recalculatedStats
          }
        })

        // Also update the separate meals state used for meal history display
        setMeals(prev => [newMeal, ...prev])
        loadDailyMicronutrientIntake()

        // Notify dashboard that nutrition data has been updated
        localStorage.setItem('nutritionDataUpdated', Date.now().toString())

        // Also refresh data from server to ensure consistency
        setTimeout(async () => {
          await refreshNutritionData()
        }, 500)
      } else {
        alert('Failed to log food: ' + result.error)
      }
    } catch (error) {
      alert('Error logging food')
    } finally {
      setLogMealLoading(false)
    }
  }

  const removeFoodFromMeal = (index: number) => {
    setSelectedFoods(prev => prev.filter((_, i) => i !== index))
  }

  const updateFoodQuantity = (index: number, quantity: number) => {
    setSelectedFoods(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: Math.max(0.1, quantity) } : item
    ))
  }

  const calculateMealTotals = () => {
    return selectedFoods.reduce(
      (totals, { food, quantity }) => {
        const multiplier = quantity / food.serving_size
        return {
          calories: totals.calories + (food.calories_per_serving * multiplier),
          protein: totals.protein + (food.protein_grams * multiplier),
          carbs: totals.carbs + (food.carbs_grams * multiplier),
          fat: totals.fat + (food.fat_grams * multiplier),
          fiber: totals.fiber + (food.fiber_grams * multiplier)
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )
  }

  const handleLogMeal = async () => {
    if (selectedFoods.length === 0) {
      alert('Please add at least one food to your meal')
      return
    }

    setLogMealLoading(true)
    try {
      // If editing, delete the old meal first
      if (editingMealId) {
        const deleteResult = await deleteMeal(editingMealId)
        if (!deleteResult.success) {
          alert('Failed to update meal: ' + deleteResult.error)
          return
        }
      }

      const mealData = new FormData()
      mealData.append('meal_type', selectedMealType)
      mealData.append('meal_date', mealDate)
      if (mealTime) mealData.append('meal_time', mealTime)
      if (mealNotes) mealData.append('notes', mealNotes)

      // Add meal items
      selectedFoods.forEach(({ food, quantity }, index) => {
        mealData.append(`food_${index}`, food.id)
        mealData.append(`quantity_${index}`, quantity.toString())
      })

      const result = await logMeal(mealData)
      if (result.success && result.data) {
        // Update local data
        const newMeal = result.data
        
        if (editingMealId) {
          // For editing, remove the old meal and add the new one
          setData(prev => {
            const remainingMeals = prev.meals.filter(meal => meal.id !== editingMealId).concat(newMeal)
            const today = (() => {
              const d = new Date()
              const year = d.getFullYear()
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            })()
            
            // Recalculate daily nutrition stats from remaining meals for today
            const todayMeals = remainingMeals.filter(meal => meal.meal_date === today)
            const recalculatedStats = todayMeals.reduce(
              (acc, meal) => ({
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
            
            return {
              ...prev,
              meals: remainingMeals,
              dailyNutritionStats: recalculatedStats
            }
          })

          // Also update the separate meals state used for meal history display
          setMeals(prev => prev.filter(meal => meal.id !== editingMealId).concat(newMeal))
          loadDailyMicronutrientIntake()

          // Notify dashboard that nutrition data has been updated
          localStorage.setItem('nutritionDataUpdated', Date.now().toString())
        } else {
          // For new meals
          setData(prev => {
            const updatedMeals = [newMeal, ...prev.meals]
            const today = (() => {
              const d = new Date()
              const year = d.getFullYear()
              const month = String(d.getMonth() + 1).padStart(2, '0')
              const day = String(d.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            })()
            
            // Recalculate daily nutrition stats from all meals for today
            const todayMeals = updatedMeals.filter(meal => meal.meal_date === today)
            const recalculatedStats = todayMeals.reduce(
              (acc, meal) => ({
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
            
            return {
              ...prev,
              meals: updatedMeals,
              dailyNutritionStats: recalculatedStats
            }
          })

          // Also update the separate meals state used for meal history display
          setMeals(prev => [newMeal, ...prev])
          loadDailyMicronutrientIntake()

          // Notify dashboard that nutrition data has been updated
          localStorage.setItem('nutritionDataUpdated', Date.now().toString())
        }

        // Reset form
        setSelectedFoods([])
        setMealNotes('')
        setMealTime('')
        setEditingMealId(null)
        
        // Switch to meals tab to show the updated meal
        setActiveTab('meals')
        alert(editingMealId ? 'Meal updated successfully!' : 'Meal logged successfully!')
        
        // Refresh data to update weekly chart and other displays
        await refreshNutritionData()
      } else {
        alert(result.error || 'Failed to log meal')
      }
    } catch (error) {
      console.error('Error logging meal:', error)
      alert('Failed to log meal')
    } finally {
      setLogMealLoading(false)
    }
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Are you sure you want to delete this meal? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteMeal(mealId)
      if (result.success) {
        // Update local data by removing the deleted meal
        setData(prev => {
          const remainingMeals = prev.meals.filter(meal => meal.id !== mealId)
          const today = (() => {
            const d = new Date()
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          })()
          
          // Recalculate daily nutrition stats from remaining meals for today
          const todayMeals = remainingMeals.filter(meal => meal.meal_date === today)
          const recalculatedStats = todayMeals.reduce(
            (acc, meal) => ({
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
          
          return {
            ...prev,
            meals: remainingMeals,
            dailyNutritionStats: recalculatedStats
          }
        })

        // Also update the separate meals state used for meal history display
        setMeals(prev => prev.filter(meal => meal.id !== mealId))
        loadDailyMicronutrientIntake()
      } else {
        alert('Failed to delete meal: ' + result.error)
      }
      // Refresh data to update weekly chart
      await refreshNutritionData()
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('Failed to delete meal')
    }
  }

  const handleEditMeal = async (meal: Meal) => {
    // Handle hydration entries differently
    if (meal.meal_type === 'hydration') {
      const currentAmount = meal.notes?.match(/(\d+)ml/)?.[1] || '0'
      const newAmount = prompt('Enter new hydration amount in ml:', currentAmount)
      
      if (newAmount && newAmount !== currentAmount) {
        try {
          const amount_ml = parseInt(newAmount)
          if (isNaN(amount_ml) || amount_ml <= 0) {
            alert('Please enter a valid amount in ml')
            return
          }

          // Update the hydration log
          const { createClient } = await import('@/lib/supabase')
          const supabase = createClient()
          
          // Find and update the hydration log
          const { error: hydrationError } = await supabase
            .from('hydration_logs')
            .update({ amount_ml })
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .eq('amount_ml', parseInt(currentAmount))
            .eq('created_at', meal.meal_date)

          if (hydrationError) {
            console.error('Error updating hydration log:', hydrationError)
            alert('Failed to update hydration log')
            return
          }

          // Update the meal notes
          const updatedNotes = meal.notes?.replace(/(\d+)ml/, `${amount_ml}ml`) || `💧 Hydration: ${amount_ml}ml`
          const { error: mealError } = await supabase
            .from('meals')
            .update({ notes: updatedNotes })
            .eq('id', meal.id)

          if (mealError) {
            console.error('Error updating meal:', mealError)
            alert('Failed to update meal')
            return
          }

          // Refresh data
          await refreshNutritionData()
          alert('Hydration entry updated successfully!')
        } catch (error) {
          console.error('Error updating hydration:', error)
          alert('Failed to update hydration entry')
        }
      }
      return
    }

    // Switch to log meal tab
    setActiveTab('log')
    
    // Set editing mode
    setEditingMealId(meal.id)
    
    // Pre-populate the form with meal data
    setSelectedMealType(meal.meal_type)
    setMealDate(meal.meal_date)
    setMealTime(meal.meal_time || '')
    setMealNotes(meal.notes || '')
    
    // Clear current foods and load the meal's foods
    setSelectedFoods([])
    
    // We need to fetch the meal items to populate selectedFoods
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { data: mealItems, error } = await supabase
        .from('meal_items')
        .select(`
          quantity,
          food_items (*)
        `)
        .eq('meal_id', meal.id)
      
      if (!error && mealItems) {
        const foods = mealItems.map((item: any) => ({
          food: item.food_items,
          quantity: item.quantity
        }))
        setSelectedFoods(foods)
      }
    } catch (error) {
      console.error('Error loading meal items for editing:', error)
      alert('Failed to load meal data for editing')
    }
  }

  const handleLogHydration = async (amount_ml: number) => {
    try {
      const formData = new FormData()
      formData.append('amount_ml', amount_ml.toString())
      
      const result = await logHydration(formData)
      if (result.success) {
        // Refresh data
        await refreshNutritionData()
        alert('Hydration logged successfully!')
      } else {
        alert('Failed to log hydration: ' + result.error)
      }
    } catch (error) {
      console.error('Error logging hydration:', error)
      alert('Failed to log hydration')
    }
  }

  const handleGoalChange = (goalType: string, value: number) => {
    setGoalChanges(prev => ({
      ...prev,
      [goalType]: value
    }))
  }

  // Meal Template handlers
  const handleQuickLog = async (templateId: string) => {
    // Use local date instead of UTC
    const today = (() => {
      const d = new Date()
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })()
    try {
      const result = await logMealFromTemplate(templateId, today, undefined, user!.id)
      if (result.success && result.data) {
        const newMeal = result.data
        // Update local data immediately
        setData(prev => {
          const updatedMeals = [newMeal, ...prev.meals]
          const today = (() => {
            const d = new Date()
            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          })()
          
          // Recalculate daily nutrition stats from all meals for today
          const todayMeals = updatedMeals.filter(meal => meal.meal_date === today)
          const recalculatedStats = todayMeals.reduce(
            (acc, meal) => ({
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
          
          return {
            ...prev,
            meals: updatedMeals,
            dailyNutritionStats: recalculatedStats
          }
        })

        // Also update the separate meals state used for meal history display
        setMeals(prev => [newMeal, ...prev])
        loadDailyMicronutrientIntake()

        // Notify dashboard that nutrition data has been updated
        localStorage.setItem('nutritionDataUpdated', Date.now().toString())

        alert('Meal logged successfully!')
        // Refresh data to update weekly chart
        await refreshNutritionData()
      } else {
        alert('Failed to log meal: ' + result.error)
      }
    } catch (error) {
      console.error('Error logging meal from template:', error)
      alert('Failed to log meal from template')
    }
  }

  const handleEditTemplate = async (template: MealTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      meal_type: template.meal_type,
      description: template.description || '',
      food_items: []
    })
    setShowTemplateModal(true)

    // Load template items
    try {
      const { template: templateData, items } = await getMealTemplateWithItems(template.id)
      if (templateData && items) {
        setTemplateForm(prev => ({
          ...prev,
          food_items: items.map((item: MealTemplateItem) => ({
            food_item_id: item.food_item_id,
            quantity: item.quantity
          }))
        }))
      }
    } catch (error) {
      console.error('Error loading template items:', error)
      alert('Failed to load template items for editing')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this meal template? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteMealTemplate(templateId)
      if (result.success) {
        // Update local data
        setData(prev => ({
          ...prev,
          mealTemplates: prev.mealTemplates.filter(template => template.id !== templateId)
        }))
        alert('Template deleted successfully!')
      } else {
        alert('Failed to delete template: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleSaveGoals = async () => {
    setSavingGoals(true)
    try {
      const promises = Object.entries(goalChanges).map(([goalType, targetValue]) =>
        upsertNutritionGoal({
          goal_type: goalType,
          target_value: targetValue
        })
      )

      const results = await Promise.all(promises)
      const failures = results.filter(result => !result.success)

      if (failures.length > 0) {
        alert('Failed to save some goals: ' + failures.map(f => f.error).join(', '))
      } else {
        alert('Goals saved successfully!')
        setGoalChanges({})
        // Refresh to get updated goals
        router.refresh()
      }
    } catch (error) {
      console.error('Error saving goals:', error)
      alert('Failed to save goals')
    } finally {
      setSavingGoals(false)
    }
  }

  // Saved Foods handlers
  const handleSaveFood = async (foodId: string) => {
    try {
      const result = await saveFood(user!.id, foodId)
      if (result.success) {
        // Refresh saved foods
        const savedFoodsResult = await getSavedFoods(user!.id)
        if (savedFoodsResult.success) {
          setData(prev => ({
            ...prev,
            savedFoods: savedFoodsResult.data || []
          }))
        }
      } else {
        alert('Failed to save food: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving food:', error)
      alert('Failed to save food')
    }
  }

  const handleRemoveSavedFood = async (savedFoodId: string) => {
    try {
      const result = await removeSavedFood(savedFoodId)
      if (result.success) {
        // Update local data
        setData(prev => ({
          ...prev,
          savedFoods: prev.savedFoods.filter(saved => saved.id !== savedFoodId)
        }))
      } else {
        alert('Failed to remove saved food: ' + result.error)
      }
    } catch (error) {
      console.error('Error removing saved food:', error)
      alert('Failed to remove saved food')
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <NavBar />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#1a3a2a',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            🍎 Nutrition Dashboard
          </h1>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'dashboard', label: 'Overview', icon: '📊' },
              { id: 'foods', label: 'Food Database', icon: '🥕' },
              { id: 'usda-search', label: 'USDA Search', icon: '🔍' },
              { id: 'barcode-scan', label: 'Scan Barcode', icon: '📱' },
              { id: 'meals', label: 'Meal History', icon: '🍽️' },
              { id: 'templates', label: 'Meal Templates', icon: '📋' },
              { id: 'saved', label: 'Saved Foods', icon: '⭐' },
              { id: 'log', label: 'Log Meal', icon: '➕' },
              { id: 'goals', label: 'Goals', icon: '🎯' },
              { id: 'ai-insights', label: 'AI Insights', icon: '🤖' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                    : '#f8f9fa',
                  color: activeTab === tab.id ? '#fff' : '#1a3a2a',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: activeTab === tab.id ? '0 4px 16px rgba(255,107,53,0.3)' : 'none'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
              Today's Nutrition
            </h2>

            {/* Nutrition Overview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {Math.round(data.dailyNutritionStats.total_calories)}
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Calories
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value || 2200}
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {Math.round(data.dailyNutritionStats.total_protein)}g
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Protein
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value || 150}g
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {Math.round(data.dailyNutritionStats.total_carbs)}g
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Carbs
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value || 250}g
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {Math.round(data.dailyNutritionStats.total_fat)}g
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Fat
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value || 70}g
                </p>
              </div>
            </div>

            {/* Hydration & Caffeine Summary Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {/* Hydration Card */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                textAlign: 'center',
                cursor: 'pointer'
              }}
              onClick={() => {
                const amount = prompt('Enter hydration amount in ml:', '500')
                if (amount && !isNaN(parseInt(amount))) {
                  handleLogHydration(parseInt(amount))
                }
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  💧
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Hydration
                </h4>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#1976d2',
                  marginBottom: '0.5rem'
                }}>
                  {dailyHydrationTotal}ml
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Goal: 3000ml
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#2196f3',
                  fontWeight: 'bold',
                  marginTop: '0.5rem'
                }}>
                  Click to log hydration
                </p>
              </div>

              {/* Caffeine Card */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  ☕
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Caffeine
                </h4>
                <p style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: dailyCaffeineTotal > 400 ? '#f44336' : '#f57c00',
                  marginBottom: '0.5rem'
                }}>
                  {dailyCaffeineTotal}mg
                </p>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Limit: 400mg
                </p>
              </div>
            </div>

            {/* Micronutrients Overview */}
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                🧬 Micronutrient Progress
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Track your intake of essential vitamins, minerals, and electrolytes from today's meals
              </p>

              {/* Micronutrient Categories */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  {micronutrients.slice(0, 6).map((micronutrient, index) => {
                    // Calculate actual progress based on daily intake vs RDA
                    const intake = dailyMicronutrientIntake[micronutrient.nutrient_name] || 0
                    const rda = micronutrient.rda_male || micronutrient.rda_female || 100 // fallback RDA
                    const progress = Math.min((intake / rda) * 100, 100) // Cap at 100%
                    return (
                      <div key={micronutrient.id} style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '1rem',
                        border: '1px solid #e9ecef'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 'bold', color: '#1a3a2a', fontSize: '0.9rem' }}>
                            {micronutrient.nutrient_name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>
                            {intake.toFixed(1)}{micronutrient.unit} / {micronutrient.rda_male || micronutrient.rda_female || 'N/A'}{micronutrient.unit}
                          </div>
                        </div>
                        <div style={{
                          width: '100%',
                          height: '4px',
                          background: '#e0e0e0',
                          borderRadius: '2px',
                          overflow: 'hidden',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            width: `${Math.min(progress, 100)}%`,
                            height: '100%',
                            background: progress >= 100 ? '#4caf50' : progress >= 50 ? '#ff9800' : '#2196f3',
                            borderRadius: '2px'
                          }}></div>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666' }}>
                          {Math.round(progress)}% of daily needs
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Weekly Nutrition Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              {(() => {
                const today = new Date()
                const monday = new Date(today)
                monday.setDate(today.getDate() - today.getDay() + 1)
                const sunday = new Date(monday)
                sunday.setDate(monday.getDate() + 6)
                return (
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                    {monday.toLocaleDateString()} - {sunday.toLocaleDateString()}
                  </h3>
                )
              })()}
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                � Weekly Nutrition Trends
              </h3>
              <p style={{ color: '#666', fontSize: '1rem', marginBottom: '1.5rem' }}>
                Daily intake vs goals for the current week (Monday - Sunday)
              </p>

              {(() => {
                // Calculate current week (Monday to Sunday)
                const today = new Date()
                const monday = new Date(today)
                monday.setDate(today.getDate() - today.getDay() + 1) // Monday of current week

                // Get goals
                const calorieGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value || 2200
                const proteinGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value || 150
                const carbGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value || 250
                const fatGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value || 70
                const hydrationGoal = 3000 // ml per day

                // Calculate daily totals for each day of the week
                const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                const dailyData = weekDays.map((day, index) => {
                  const dayDate = new Date(monday)
                  dayDate.setDate(monday.getDate() + index)

                  const dayMeals = data.meals.filter(meal => {
                    // Parse meal date as local date, not UTC
                    const [year, month, day] = meal.meal_date.split('-').map(Number)
                    const mealLocalDate = new Date(year, month - 1, day)
                    return mealLocalDate.toDateString() === dayDate.toDateString()
                  })

                  const dayTotals = dayMeals.reduce((acc, meal) => ({
                    calories: acc.calories + (meal.total_calories || 0),
                    protein: acc.protein + (meal.total_protein || 0),
                    carbs: acc.carbs + (meal.total_carbs || 0),
                    fat: acc.fat + (meal.total_fat || 0)
                  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                  // Get hydration for the day from meals table
                  const dayHydrationMeals = dayMeals.filter(meal => meal.meal_type === 'hydration')
                  const dayHydration = dayHydrationMeals.reduce((sum, meal) => {
                    const match = meal.notes?.match(/💧 Hydration: (\d+)ml/)
                    return sum + (match ? parseInt(match[1]) : 0)
                  }, 0)

                  return {
                    day,
                    date: dayDate,
                    ...dayTotals,
                    hydration: dayHydration
                  }
                })

                // Chart dimensions and settings
                const chartWidth = 600
                const chartHeight = 300
                const padding = 60
                const innerWidth = chartWidth - (padding * 2)
                const innerHeight = chartHeight - (padding * 2)

                // Calculate percentages for each nutrient
                const weeklyData = dailyData.map(day => ({
                  day: day.day,
                  calories: Math.min(Math.round((day.calories / calorieGoal) * 100), 200),
                  protein: Math.min(Math.round((day.protein / proteinGoal) * 100), 200),
                  carbs: Math.min(Math.round((day.carbs / carbGoal) * 100), 200),
                  fat: Math.min(Math.round((day.fat / fatGoal) * 100), 200),
                  hydration: Math.min(Math.round((day.hydration / hydrationGoal) * 100), 200)
                }))

                // Helper function to create line path
                const createLinePath = (data: number[]) => {
                  return data.map((d, i) => {
                    const x = padding + (i * (innerWidth / 6))
                    const y = padding + innerHeight - ((d / 200) * innerHeight)
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')
                }

                return (
                  <div>
                    {/* Combined Weekly Trends Chart */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                        📊 Weekly Nutrition Overview (% of Daily Goals)
                      </h4>
                      <div style={{ position: 'relative', width: '100%', maxWidth: '600px' }}>
                        <svg width="100%" height="300" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ border: '1px solid #e9ecef', borderRadius: '8px', background: '#fff' }}>
                          {/* Grid lines */}
                          {[0, 25, 50, 75, 100, 125, 150, 175, 200].map(value => {
                            const y = padding + innerHeight - ((value / 200) * innerHeight)
                            return (
                              <g key={value}>
                                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                                <text x={padding - 15} y={y + 4} textAnchor="end" fontSize="10" fill="#666">{value}%</text>
                              </g>
                            )
                          })}

                          {/* Goal line at 100% */}
                          <line x1={padding} y1={padding + innerHeight - ((100 / 200) * innerHeight)} x2={chartWidth - padding} y2={padding + innerHeight - ((100 / 200) * innerHeight)} stroke="#4caf50" strokeWidth="2" strokeDasharray="5,5" />
                          <text x={chartWidth - padding + 10} y={padding + innerHeight - ((100 / 200) * innerHeight) + 4} fontSize="11" fill="#4caf50" fontWeight="bold">Goal</text>

                          {/* Data lines */}
                          <path d={createLinePath(weeklyData.map(d => d.calories))} fill="none" stroke="#ff6b35" strokeWidth="3" />
                          <path d={createLinePath(weeklyData.map(d => d.protein))} fill="none" stroke="#667eea" strokeWidth="3" />
                          <path d={createLinePath(weeklyData.map(d => d.carbs))} fill="none" stroke="#f093fb" strokeWidth="3" />
                          <path d={createLinePath(weeklyData.map(d => d.fat))} fill="none" stroke="#4ecdc4" strokeWidth="3" />
                          <path d={createLinePath(weeklyData.map(d => d.hydration))} fill="none" stroke="#2196f3" strokeWidth="3" />

                          {/* Data points and labels */}
                          {weeklyData.map((day, i) => {
                            const x = padding + (i * (innerWidth / 6))
                            return (
                              <g key={day.day}>
                                {/* Calories point */}
                                <circle
                                  cx={x}
                                  cy={padding + innerHeight - ((day.calories / 200) * innerHeight)}
                                  r="4"
                                  fill={day.calories >= 100 ? "#4caf50" : "#ff6b35"}
                                  stroke="#fff"
                                  strokeWidth="2"
                                />
                                {/* Protein point */}
                                <circle
                                  cx={x}
                                  cy={padding + innerHeight - ((day.protein / 200) * innerHeight)}
                                  r="4"
                                  fill={day.protein >= 100 ? "#4caf50" : "#667eea"}
                                  stroke="#fff"
                                  strokeWidth="2"
                                />
                                {/* Carbs point */}
                                <circle
                                  cx={x}
                                  cy={padding + innerHeight - ((day.carbs / 200) * innerHeight)}
                                  r="4"
                                  fill={day.carbs >= 100 ? "#4caf50" : "#f093fb"}
                                  stroke="#fff"
                                  strokeWidth="2"
                                />
                                {/* Fat point */}
                                <circle
                                  cx={x}
                                  cy={padding + innerHeight - ((day.fat / 200) * innerHeight)}
                                  r="4"
                                  fill={day.fat >= 100 ? "#4caf50" : "#4ecdc4"}
                                  stroke="#fff"
                                  strokeWidth="2"
                                />
                                {/* Hydration point */}
                                <circle
                                  cx={x}
                                  cy={padding + innerHeight - ((day.hydration / 200) * innerHeight)}
                                  r="4"
                                  fill={day.hydration >= 100 ? "#4caf50" : "#2196f3"}
                                  stroke="#fff"
                                  strokeWidth="2"
                                />
                              </g>
                            )
                          })}

                          {/* X-axis labels */}
                          {weekDays.map((day, i) => {
                            const x = padding + (i * (innerWidth / 6))
                            return (
                              <text key={day} x={x} y={chartHeight - 15} textAnchor="middle" fontSize="11" fill="#666" fontWeight="bold">
                                {day}
                              </text>
                            )
                          })}
                        </svg>
                      </div>

                      {/* Legend */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        justifyContent: 'center',
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#ff6b35', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>🔥 Calories</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#667eea', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>💪 Protein</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#f093fb', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>🌾 Carbs</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#4ecdc4', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>🥑 Fat</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#2196f3', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>💧 Hydration</span>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Nutrition Trends Chart */}
                    <div style={{ marginBottom: '2rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h3>
                      <h4 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                        📅 Monthly Nutrition Overview (% of Daily Goals)
                      </h4>
                      <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                        {(() => {
                          // Calculate current month data
                          const today = new Date()
                          const currentMonth = today.getMonth()
                          const currentYear = today.getFullYear()
                          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

                          // Get goals (same as weekly)
                          const calorieGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value || 2200
                          const proteinGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value || 150
                          const carbGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value || 250
                          const fatGoal = data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value || 70
                          const hydrationGoal = 3000 // ml per day

                          // Calculate daily totals for each day of the month
                          const monthlyData = Array.from({ length: daysInMonth }, (_, i) => {
                            const dayNumber = i + 1
                            const dayDate = new Date(currentYear, currentMonth, dayNumber)

                            const dayMeals = data.meals.filter(meal => {
                              // Parse meal date as local date, not UTC
                              const [year, month, day] = meal.meal_date.split('-').map(Number)
                              const mealLocalDate = new Date(year, month - 1, day)
                              return mealLocalDate.toDateString() === dayDate.toDateString()
                            })

                            const dayTotals = dayMeals.reduce((acc, meal) => ({
                              calories: acc.calories + (meal.total_calories || 0),
                              protein: acc.protein + (meal.total_protein || 0),
                              carbs: acc.carbs + (meal.total_carbs || 0),
                              fat: acc.fat + (meal.total_fat || 0)
                            }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

                            // Get hydration for the day from meals table
                            const dayHydrationMeals = dayMeals.filter(meal => meal.meal_type === 'hydration')
                            const dayHydration = dayHydrationMeals.reduce((sum, meal) => {
                              const match = meal.notes?.match(/💧 Hydration: (\d+)ml/)
                              return sum + (match ? parseInt(match[1]) : 0)
                            }, 0)

                            return {
                              day: dayNumber,
                              date: dayDate,
                              ...dayTotals,
                              hydration: dayHydration
                            }
                          })

                          // Chart dimensions (wider for monthly view)
                          const chartWidth = 800
                          const chartHeight = 300
                          const padding = 60
                          const innerWidth = chartWidth - (padding * 2)
                          const innerHeight = chartHeight - (padding * 2)

                          // Calculate percentages for each nutrient
                          const monthlyChartData = monthlyData.map(day => ({
                            day: day.day,
                            calories: Math.min(Math.round((day.calories / calorieGoal) * 100), 200),
                            protein: Math.min(Math.round((day.protein / proteinGoal) * 100), 200),
                            carbs: Math.min(Math.round((day.carbs / carbGoal) * 100), 200),
                            fat: Math.min(Math.round((day.fat / fatGoal) * 100), 200),
                            hydration: Math.min(Math.round((day.hydration / hydrationGoal) * 100), 200)
                          }))

                          // Helper function to create line path
                          const createMonthlyLinePath = (data: number[]) => {
                            return data.map((d, i) => {
                              const x = padding + (i * (innerWidth / (daysInMonth - 1)))
                              const y = padding + innerHeight - ((d / 200) * innerHeight)
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                            }).join(' ')
                          }

                          return (
                            <svg width="100%" height="300" viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ border: '1px solid #e9ecef', borderRadius: '8px', background: '#fff' }}>
                              {/* Grid lines */}
                              {[0, 25, 50, 75, 100, 125, 150, 175, 200].map(value => {
                                const y = padding + innerHeight - ((value / 200) * innerHeight)
                                return (
                                  <g key={value}>
                                    <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f0f0f0" strokeWidth="1" />
                                    <text x={padding - 15} y={y + 4} textAnchor="end" fontSize="10" fill="#666">{value}%</text>
                                  </g>
                                )
                              })}

                              {/* Goal line at 100% */}
                              <line x1={padding} y1={padding + innerHeight - ((100 / 200) * innerHeight)} x2={chartWidth - padding} y2={padding + innerHeight - ((100 / 200) * innerHeight)} stroke="#4caf50" strokeWidth="2" strokeDasharray="5,5" />
                              <text x={chartWidth - padding + 10} y={padding + innerHeight - ((100 / 200) * innerHeight) + 4} fontSize="11" fill="#4caf50" fontWeight="bold">Goal</text>

                              {/* Data lines */}
                              <path d={createMonthlyLinePath(monthlyChartData.map(d => d.calories))} fill="none" stroke="#ff6b35" strokeWidth="2" />
                              <path d={createMonthlyLinePath(monthlyChartData.map(d => d.protein))} fill="none" stroke="#667eea" strokeWidth="2" />
                              <path d={createMonthlyLinePath(monthlyChartData.map(d => d.carbs))} fill="none" stroke="#f093fb" strokeWidth="2" />
                              <path d={createMonthlyLinePath(monthlyChartData.map(d => d.fat))} fill="none" stroke="#4ecdc4" strokeWidth="2" />
                              <path d={createMonthlyLinePath(monthlyChartData.map(d => d.hydration))} fill="none" stroke="#2196f3" strokeWidth="2" />

                              {/* Data points (only show every 3rd day to avoid overcrowding) */}
                              {monthlyChartData.filter((_, i) => i % 3 === 0 || i === daysInMonth - 1).map((day, i) => {
                                const originalIndex = monthlyChartData.findIndex(d => d.day === day.day)
                                const x = padding + (originalIndex * (innerWidth / (daysInMonth - 1)))
                                return (
                                  <g key={day.day}>
                                    {/* Calories point */}
                                    <circle
                                      cx={x}
                                      cy={padding + innerHeight - ((day.calories / 200) * innerHeight)}
                                      r="3"
                                      fill={day.calories >= 100 ? "#4caf50" : "#ff6b35"}
                                      stroke="#fff"
                                      strokeWidth="1"
                                    />
                                    {/* Protein point */}
                                    <circle
                                      cx={x}
                                      cy={padding + innerHeight - ((day.protein / 200) * innerHeight)}
                                      r="3"
                                      fill={day.protein >= 100 ? "#4caf50" : "#667eea"}
                                      stroke="#fff"
                                      strokeWidth="1"
                                    />
                                    {/* Carbs point */}
                                    <circle
                                      cx={x}
                                      cy={padding + innerHeight - ((day.carbs / 200) * innerHeight)}
                                      r="3"
                                      fill={day.carbs >= 100 ? "#4caf50" : "#f093fb"}
                                      stroke="#fff"
                                      strokeWidth="1"
                                    />
                                    {/* Fat point */}
                                    <circle
                                      cx={x}
                                      cy={padding + innerHeight - ((day.fat / 200) * innerHeight)}
                                      r="3"
                                      fill={day.fat >= 100 ? "#4caf50" : "#4ecdc4"}
                                      stroke="#fff"
                                      strokeWidth="1"
                                    />
                                    {/* Hydration point */}
                                    <circle
                                      cx={x}
                                      cy={padding + innerHeight - ((day.hydration / 200) * innerHeight)}
                                      r="3"
                                      fill={day.hydration >= 100 ? "#4caf50" : "#2196f3"}
                                      stroke="#fff"
                                      strokeWidth="1"
                                    />
                                  </g>
                                )
                              })}

                              {/* X-axis labels (show every 5th day) */}
                              {Array.from({ length: Math.ceil(daysInMonth / 5) }, (_, i) => i * 5 + 1)
                                .filter(day => day <= daysInMonth)
                                .map(day => {
                                  const dayIndex = day - 1
                                  const x = padding + (dayIndex * (innerWidth / (daysInMonth - 1)))
                                  return (
                                    <text key={day} x={x} y={chartHeight - 15} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">
                                      {day}
                                    </text>
                                  )
                                })}
                            </svg>
                          )
                        })()}
                      </div>

                      {/* Legend (reuse the same legend) */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        justifyContent: 'center',
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#ff6b35', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>🔥 Calories</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#667eea', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>💪 Protein</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#f093fb', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>🌾 Carbs</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#4ecdc4', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>🥑 Fat</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '3px', background: '#2196f3', borderRadius: '2px' }}></div>
                          <span style={{ fontSize: '0.9rem', color: '#1a3a2a' }}>💧 Hydration</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Food Database Tab */}
        {activeTab === 'foods' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
                🥕 Food Database
              </h2>
              <button
                onClick={() => setShowAddFoodForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.3)'
                }}
              >
                ➕ Add Food
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ marginBottom: '2rem' }}>
              <input
                type="text"
                placeholder="Search foods..."
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '25px',
                  border: '2px solid #e9ecef',
                  fontSize: '1rem',
                  outline: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            {/* Food Items Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem'
            }}>
              {foodItems.map((food) => (
                <div key={food.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    {(() => {
                      const isSaved = data.savedFoods.some(saved => saved.food_item_id === food.id)
                      return (
                        <button
                          onClick={() => isSaved ? handleRemoveSavedFood(data.savedFoods.find(saved => saved.food_item_id === food.id)!.id) : handleSaveFood(food.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: isSaved ? '#28a745' : '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
                          }}
                        >
                          {isSaved ? '⭐' : '☆'}
                        </button>
                      )
                    })()}
                    <button
                      onClick={() => setEditingFood(food)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#007bff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: '#1a3a2a',
                    marginBottom: '0.5rem'
                  }}>
                    {food.name}
                  </h3>
                  {food.brand && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#666',
                      marginBottom: '1rem'
                    }}>
                      {food.brand}
                    </p>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    <div><strong>Serving:</strong> {food.serving_size} {food.serving_unit}</div>
                    <div><strong>Calories:</strong> {food.calories_per_serving}</div>
                    <div><strong>Protein:</strong> {food.protein_grams}g</div>
                    <div><strong>Carbs:</strong> {food.carbs_grams}g</div>
                    <div><strong>Fat:</strong> {food.fat_grams}g</div>
                    <div><strong>Fiber:</strong> {food.fiber_grams}g</div>
                  </div>
                </div>
              ))}
            </div>

            {foodItems.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                {foodSearch ? 'No foods found matching your search.' : 'No food items yet. Add your first food!'}
              </div>
            )}

            {isLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Loading foods...
              </div>
            )}
          </div>
        )}

        {/* USDA Food Search Tab */}
        {activeTab === 'usda-search' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
                🔍 USDA Food Search
              </h2>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <FoodSearch
                onFoodSelect={(food: USDAFoodItem) => {
                  setSelectedUSDAFood(food);
                }}
                placeholder="Search USDA food database..."
              />
            </div>

            {selectedUSDAFood && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1a3a2a' }}>
                    Nutrition Facts
                  </h3>
                  <button
                    onClick={async () => {
                      if (!selectedUSDAFood) return;

                      try {
                        // Convert USDA food to FormData for saving
                        const formData = new FormData();
                        formData.append('name', selectedUSDAFood.description);
                        formData.append('brand', selectedUSDAFood.brandName || '');
                        formData.append('serving_size', selectedUSDAFood.nutrition.servingSizeGrams.toString());
                        formData.append('serving_unit', 'g');
                        formData.append('calories_per_serving', selectedUSDAFood.nutrition.calories.toString());
                        formData.append('protein_grams', selectedUSDAFood.nutrition.protein.toString());
                        formData.append('carbs_grams', selectedUSDAFood.nutrition.carbs.toString());
                        formData.append('fat_grams', selectedUSDAFood.nutrition.fat.toString());
                        formData.append('fiber_grams', selectedUSDAFood.nutrition.fiber.toString());
                        formData.append('sugar_grams', selectedUSDAFood.nutrition.sugar.toString());
                        formData.append('sodium_mg', selectedUSDAFood.nutrition.sodium.toString());

                        await createFoodItem(formData);
                        alert('Food saved to your personal database!');
                        // Refresh food items
                        await loadFoodItems();
                      } catch (error) {
                        console.error('Error saving food:', error);
                        alert('Failed to save food. It may already exist in your database.');
                      }
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    💾 Save to Database
                  </button>
                </div>
                <NutritionFacts
                  food={selectedUSDAFood}
                  className="max-w-md mx-auto"
                />
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <div style={{
                background: '#e8f5e8',
                border: '1px solid #c8e6c9',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>💡 How to use USDA Food Search</h4>
                <ul style={{ color: '#2e7d32', margin: 0, paddingLeft: '1.5rem' }}>
                  <li>Search for any food by name (e.g., "banana", "chicken breast", "brown rice")</li>
                  <li>Click on a food to see its nutrition facts</li>
                  <li>Get accurate nutrition data from the USDA's comprehensive database</li>
                  <li>Perfect for meal planning and tracking</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Barcode Scanning Tab */}
        {activeTab === 'barcode-scan' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ margin: 0, color: '#1a3a2a' }}>📱 Scan Product Barcode</h2>
              <button
                onClick={() => setShowBarcodeScanner(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ff6b35',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem'
                }}
              >
                📷 Open Scanner
              </button>
            </div>

            {selectedBarcodeFood && (
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem',
                border: '1px solid #dee2e6'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a3a2a' }}>
                      {selectedBarcodeFood.product_name}
                    </h3>
                    {selectedBarcodeFood.brands && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                        Brand: {selectedBarcodeFood.brands}
                      </p>
                    )}
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                      Barcode: {selectedBarcodeFood.code}
                    </p>
                  </div>
                  {selectedBarcodeFood.image_url && (
                    <img
                      src={selectedBarcodeFood.image_url}
                      alt={selectedBarcodeFood.product_name}
                      style={{
                        width: '80px',
                        height: '80px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button
                    onClick={async () => {
                      if (!selectedBarcodeFood) return;

                      try {
                        // Convert barcode food to FormData for saving
                        const formData = new FormData();
                        formData.append('name', selectedBarcodeFood.product_name);
                        formData.append('brand', selectedBarcodeFood.brands || '');
                        formData.append('serving_size', selectedBarcodeFood.nutrition.servingSizeGrams.toString());
                        formData.append('serving_unit', 'g');
                        formData.append('calories_per_serving', selectedBarcodeFood.nutrition.calories.toString());
                        formData.append('protein_grams', selectedBarcodeFood.nutrition.protein.toString());
                        formData.append('carbs_grams', selectedBarcodeFood.nutrition.carbs.toString());
                        formData.append('fat_grams', selectedBarcodeFood.nutrition.fat.toString());
                        formData.append('fiber_grams', selectedBarcodeFood.nutrition.fiber.toString());
                        formData.append('sugar_grams', selectedBarcodeFood.nutrition.sugar.toString());
                        formData.append('sodium_mg', selectedBarcodeFood.nutrition.sodium.toString());

                        await createFoodItem(formData);
                        alert('Food saved to your personal database!');
                        // Refresh food items
                        await loadFoodItems();
                        setSelectedBarcodeFood(null);
                      } catch (error) {
                        console.error('Error saving barcode food:', error);
                        alert('Failed to save food. It may already exist in your database.');
                      }
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#28a745',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    💾 Save to Database
                  </button>
                  <button
                    onClick={() => setSelectedBarcodeFood(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#6c757d',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500'
                    }}
                  >
                    Clear
                  </button>
                </div>
                <NutritionFacts
                  food={{
                    fdcId: parseInt(selectedBarcodeFood.code) || 0,
                    description: selectedBarcodeFood.product_name,
                    brandName: selectedBarcodeFood.brands,
                    nutrition: selectedBarcodeFood.nutrition
                  }}
                  className="max-w-md mx-auto"
                />
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <div style={{
                background: '#e8f5e8',
                border: '1px solid #c8e6c9',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <h4 style={{ color: '#2e7d32', marginBottom: '0.5rem' }}>💡 How to use Barcode Scanning</h4>
                <ul style={{ color: '#2e7d32', margin: 0, paddingLeft: '1.5rem' }}>
                  <li>Click "Open Scanner" to use your camera to scan product barcodes</li>
                  <li>Or manually enter a barcode number if scanning doesn't work</li>
                  <li>Get nutrition data from Open Food Facts database</li>
                  <li>Perfect for packaged foods, supplements, and ready-to-eat products</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Meal History Tab */}
        {activeTab === 'meals' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
                🍽️ Meal History
              </h2>
            </div>

            {/* Filters */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Meal Type
                </label>
                <select
                  value={mealFilter}
                  onChange={(e) => setMealFilter(e.target.value as any)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    minWidth: '120px'
                  }}
                >
                  <option value="all">All Meals</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snacks</option>
                  <option value="hydration">💧 Hydration</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {(mealFilter !== 'all' || dateFilter) && (
                <button
                  onClick={() => {
                    setMealFilter('all')
                    setDateFilter('')
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    alignSelf: 'flex-end'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Meals List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {meals
                .filter(meal => {
                  if (mealFilter !== 'all' && meal.meal_type !== mealFilter) return false
                  if (dateFilter && meal.meal_date !== dateFilter) return false
                  return true
                })
                .sort((a, b) => {
                  // Sort by time descending (most recent first)
                  // Handle null meal_time values by treating them as empty strings
                  const aTime = a.meal_time || ''
                  const bTime = b.meal_time || ''
                  return bTime.localeCompare(aTime)
                })
                .map((meal: Meal) => (
                  <div key={meal.id} style={{
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          color: '#1a3a2a',
                          marginBottom: '0.5rem',
                          textTransform: 'capitalize'
                        }}>
                          {meal.meal_type === 'hydration' ? '💧 Hydration' : meal.meal_type}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {(() => {
                            // Parse the date string as local date, not UTC
                            const [year, month, day] = meal.meal_date.split('-').map(Number)
                            const localDate = new Date(year, month - 1, day)
                            return localDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          })()}
                          {meal.meal_time && ` at ${meal.meal_time}`}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        {meal.meal_type === 'hydration' ? (
                          <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2196f3' }}>
                              {meal.notes?.match(/(\d+)ml/)?.[1] || '0'}ml
                            </div>
                            <div>Hydration</div>
                          </div>
                        ) : (
                          <>
                            <div><strong>{Math.round(meal.total_calories)}</strong> calories</div>
                            <div>{Math.round(meal.total_protein)}g protein</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Nutrition Breakdown - only show for actual meals, not hydration */}
                    {meal.meal_type !== 'hydration' && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                        gap: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#ff6b35'
                          }}>
                            {Math.round(meal.total_protein)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Protein</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#f7931e'
                          }}>
                            {Math.round(meal.total_carbs)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Carbs</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#4ecdc4'
                          }}>
                            {Math.round(meal.total_fat)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Fat</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: '#667eea'
                          }}>
                            {Math.round(meal.total_fiber)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Fiber</div>
                        </div>
                      </div>
                    )}

                    {meal.notes && (
                      <div style={{
                        padding: '1rem',
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #e9ecef',
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        <strong>Notes:</strong> {meal.notes}
                      </div>
                    )}

                    {/* Edit/Delete Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'flex-end',
                      marginTop: '1rem'
                    }}>
                      <button
                        onClick={() => handleEditMeal(meal)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMeal(meal.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {meals.length === 0 && !mealsLoading && (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                No meals logged yet. Switch to the "Log Meal" tab to add your first meal!
              </div>
            )}

            {mealsLoading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                Loading meals...
              </div>
            )}
          </div>
        )}

        {/* Log Meal Tab */}
        {activeTab === 'log' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
                {editingMealId ? '✏️ Edit Meal' : '➕ Log Meal'}
              </h2>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem'
            }}>
              {/* Meal Details */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '1.5rem'
                }}>
                  Meal Details
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Meal Type *
                    </label>
                    <select
                      value={selectedMealType}
                      onChange={(e) => setSelectedMealType(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Date *
                      </label>
                      <input
                        type="date"
                        value={mealDate}
                        onChange={(e) => setMealDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                        Time (optional)
                      </label>
                      <input
                        type="time"
                        value={mealTime}
                        onChange={(e) => setMealTime(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '1rem'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Notes (optional)
                    </label>
                    <textarea
                      value={mealNotes}
                      onChange={(e) => setMealNotes(e.target.value)}
                      placeholder="Any notes about this meal..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Meal Summary */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '1.5rem'
                }}>
                  Meal Summary
                </h3>

                {(() => {
                  const totals = calculateMealTotals()
                  return (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: '1rem'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#ff6b35'
                          }}>
                            {Math.round(totals.calories)}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Calories</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#667eea'
                          }}>
                            {Math.round(totals.protein)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Protein</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#f7931e'
                          }}>
                            {Math.round(totals.carbs)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Carbs</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#4ecdc4'
                          }}>
                            {Math.round(totals.fat)}g
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666' }}>Fat</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {editingMealId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMealId(null)
                              setSelectedFoods([])
                              setMealNotes('')
                              setMealTime('')
                              setSelectedMealType('breakfast')
                              setMealDate(() => {
                                const today = new Date()
                                const year = today.getFullYear()
                                const month = String(today.getMonth() + 1).padStart(2, '0')
                                const day = String(today.getDate()).padStart(2, '0')
                                return `${year}-${month}-${day}`
                              })
                            }}
                            style={{
                              flex: 1,
                              padding: '1rem',
                              background: '#6c757d',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '1.1rem',
                              fontWeight: 'bold',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel Edit
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleLogMeal}
                          disabled={selectedFoods.length === 0 || logMealLoading}
                          style={{
                            flex: editingMealId ? 1 : 'none',
                            padding: '1rem',
                            background: selectedFoods.length === 0
                              ? '#6c757d'
                              : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            cursor: selectedFoods.length === 0 || logMealLoading ? 'not-allowed' : 'pointer',
                            opacity: selectedFoods.length === 0 || logMealLoading ? 0.7 : 1
                          }}
                        >
                          {logMealLoading ? (editingMealId ? 'Updating Meal...' : 'Logging Meal...') : (editingMealId ? 'Update Meal' : 'Log Meal')}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Selected Foods */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              marginTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#1a3a2a'
                }}>
                  Selected Foods ({selectedFoods.length})
                </h3>
                <button
                  onClick={() => {
                    setFoodSelectorContext('meal')
                    setFoodSelectorOpen(true)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '25px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255,107,53,0.3)'
                  }}
                >
                  ➕ Add Food
                </button>
              </div>

              {selectedFoods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No foods selected. Click "Add Food" to start building your meal.
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {selectedFoods.map(({ food, quantity }, index) => (
                    <div key={`${food.id}-${index}`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1a3a2a' }}>
                          {food.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {food.brand && `${food.brand} • `}{quantity} {food.serving_unit} ({(quantity / food.serving_size).toFixed(1)} servings)
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>
                          <div>{Math.round(food.calories_per_serving * quantity / food.serving_size)} cal</div>
                          <div>{Math.round(food.protein_grams * quantity / food.serving_size)}g protein</div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            value={quantity}
                            onChange={(e) => updateFoodQuantity(index, parseFloat(e.target.value) || 0.1)}
                            style={{
                              width: '80px',
                              padding: '0.5rem',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{food.serving_unit}</span>
                        </div>

                        <button
                          onClick={() => removeFoodFromMeal(index)}
                          style={{
                            padding: '0.5rem',
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meal Templates Tab */}
        {activeTab === 'templates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
                📋 Meal Templates
              </h2>
              <button
                onClick={() => setShowTemplateModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(255,107,53,0.3)'
                }}
              >
                ➕ Create Template
              </button>
            </div>

            {/* Templates Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {data.mealTemplates.map((template: MealTemplate) => (
                <div key={template.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                        {template.name}
                      </h3>
                      <span style={{
                        background: '#e9ecef',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        color: '#495057',
                        textTransform: 'capitalize'
                      }}>
                        {template.meal_type}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleQuickLog(template.id)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#28a745',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                        title="Log this meal"
                      >
                        🍽️
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#ffc107',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                        title="Edit template"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#dc3545',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                        title="Delete template"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {template.description && (
                    <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {template.description}
                    </p>
                  )}

                  {/* Nutrition Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>🔥 {template.total_calories} cal</div>
                    <div>🥩 {template.total_protein.toFixed(1)}g protein</div>
                    <div>🍞 {template.total_carbs.toFixed(1)}g carbs</div>
                    <div>🥑 {template.total_fat.toFixed(1)}g fat</div>
                  </div>
                </div>
              ))}
            </div>

            {data.mealTemplates.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No meal templates yet</h3>
                <p>Create reusable meal templates to speed up your logging!</p>
              </div>
            )}
          </div>
        )}

        {/* Saved Foods Tab */}
        {activeTab === 'saved' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '2rem' }}>
              ⭐ Saved Foods
            </h2>

            <div style={{
              display: 'grid',
              gap: '1rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {data.savedFoods.map((savedFood: SavedFood) => (
                <div key={savedFood.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
                        {savedFood.food_item?.name}
                      </h3>
                      {savedFood.food_item?.brand && (
                        <span style={{
                          background: '#e9ecef',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          color: '#495057'
                        }}>
                          {savedFood.food_item.brand}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => addSavedFoodToMeal(savedFood)}
                        disabled={logMealLoading}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#28a745',
                          color: '#fff',
                          cursor: logMealLoading ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          opacity: logMealLoading ? 0.7 : 1
                        }}
                        title="Log this food"
                      >
                        🍽️
                      </button>
                      <button
                        onClick={() => handleRemoveSavedFood(savedFood.id)}
                        style={{
                          padding: '0.5rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#dc3545',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                        title="Remove from saved foods"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Nutrition Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>🔥 {savedFood.food_item?.calories_per_serving} cal</div>
                    <div>🥩 {savedFood.food_item?.protein_grams}g protein</div>
                    <div>🍞 {savedFood.food_item?.carbs_grams}g carbs</div>
                    <div>🥑 {savedFood.food_item?.fat_grams}g fat</div>
                  </div>

                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#6c757d' }}>
                    Serving: {savedFood.food_item?.serving_size} {savedFood.food_item?.serving_unit}
                  </div>
                </div>
              ))}
            </div>

            {data.savedFoods.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666',
                background: '#f8f9fa',
                borderRadius: '12px',
                border: '2px dashed #dee2e6'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⭐</div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No saved foods yet</h3>
                <p>Browse the food database and save your favorite foods for quick access!</p>
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
                🎯 Nutrition Goals
              </h2>
              <div style={{
                background: '#e8f5e8',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem',
                color: '#2d5a2d',
                fontWeight: '500'
              }}>
                Today's Progress
              </div>
            </div>

            {/* Goals Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* Daily Calories Goal */}
              <div style={{
                background: 'linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '2px solid #ffe082',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ff6b35',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🔥
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: '#e65100',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>Daily Calories</span>
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Current: {data.dailyNutritionStats.total_calories} cal</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Goal: {goalChanges.daily_calories ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value ?? 2200} cal
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (data.dailyNutritionStats.total_calories / (goalChanges.daily_calories ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value ?? 2200)) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={goalChanges.daily_calories ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value ?? 2200}
                    onChange={(e) => handleGoalChange('daily_calories', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>cal</span>
                </div>
              </div>

              {/* Protein Goal */}
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e8 0%, #dcedd8 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '2px solid #81c784',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#4caf50',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  💪
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: '#2e7d32',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>Daily Protein</span>
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Current: {data.dailyNutritionStats.total_protein}g</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Goal: {goalChanges.protein_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value ?? 150}g
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (data.dailyNutritionStats.total_protein / (goalChanges.protein_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value ?? 150)) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={goalChanges.protein_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value ?? 150}
                    onChange={(e) => handleGoalChange('protein_target', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>g</span>
                </div>
              </div>

              {/* Carbs Goal */}
              <div style={{
                background: 'linear-gradient(135deg, #fff3e0 0%, #fce4d8 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '2px solid #ffb74d',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#ff9800',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🌾
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: '#e65100',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>Daily Carbs</span>
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Current: {data.dailyNutritionStats.total_carbs}g</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Goal: {goalChanges.carb_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value ?? 250}g
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (data.dailyNutritionStats.total_carbs / (goalChanges.carb_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value ?? 250)) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ff9800 0%, #ffb74d 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={goalChanges.carb_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value ?? 250}
                    onChange={(e) => handleGoalChange('carb_target', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>g</span>
                </div>
              </div>

              {/* Fat Goal */}
              <div style={{
                background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '2px solid #e91e63',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#e91e63',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🥑
                </div>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 600,
                  color: '#ad1457',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>Daily Fat</span>
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Current: {data.dailyNutritionStats.total_fat}g</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      Goal: {goalChanges.fat_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value ?? 70}g
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(100, (data.dailyNutritionStats.total_fat / (goalChanges.fat_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value ?? 70)) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #e91e63 0%, #f06292 100%)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    value={goalChanges.fat_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value ?? 70}
                    onChange={(e) => handleGoalChange('fat_target', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>g</span>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '2rem',
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              marginBottom: '2rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                📊 Today's Summary
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {Math.round((data.dailyNutritionStats.total_calories / (goalChanges.daily_calories ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value ?? 2200)) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Calories</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {Math.round((data.dailyNutritionStats.total_protein / (goalChanges.protein_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value ?? 150)) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Protein</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {Math.round((data.dailyNutritionStats.total_carbs / (goalChanges.carb_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value ?? 250)) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Carbs</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                    {Math.round((data.dailyNutritionStats.total_fat / (goalChanges.fat_target ?? data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value ?? 70)) * 100)}%
                  </div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Fat</div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleSaveGoals}
                disabled={savingGoals}
                style={{
                  padding: '1rem 3rem',
                  background: savingGoals
                    ? '#6c757d'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: savingGoals ? 'not-allowed' : 'pointer',
                  opacity: savingGoals ? 0.7 : 1,
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {savingGoals ? '💾 Saving...' : '💾 Save Goals'}
              </button>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai-insights' && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              🤖 AI Insights
            </h2>

            {/* AI Insights Sub-navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}>
              {[
                { id: 'insights', label: 'Insights', icon: '💡' },
                { id: 'habits', label: 'Habits', icon: '🔄' },
                { id: 'correlations', label: 'Correlations', icon: '📈' }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setAiInsightsSubTab(subTab.id as any)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: 'none',
                    background: aiInsightsSubTab === subTab.id
                      ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                      : '#f8f9fa',
                    color: aiInsightsSubTab === subTab.id ? '#fff' : '#1a3a2a',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease',
                    boxShadow: aiInsightsSubTab === subTab.id ? '0 4px 16px rgba(255,107,53,0.3)' : 'none'
                  }}
                >
                  {subTab.icon} {subTab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Insights Sub-Tab */}
        {activeTab === 'ai-insights' && aiInsightsSubTab === 'insights' && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              💡 Nutrition Insights
            </h2>

            {/* Insights Overview */}
            <div style={{
              background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                AI-Powered Nutrition Insights
              </h3>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Get personalized recommendations and insights based on your nutrition patterns
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                💡 Insights are generated weekly from your nutrition data
              </div>
            </div>

            {/* Generate Insights Button */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                Generate Weekly Insights
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Analyze your nutrition data from the past week and get personalized recommendations
              </p>
              <button
                onClick={async () => {
                  setInsightsLoading(true)
                  try {
                    const result = await generateWeeklyInsights()
                    if (result.success) {
                      await loadInsightsData()
                      alert('Weekly insights generated successfully!')
                    } else {
                      alert('Failed to generate insights')
                    }
                  } catch (error) {
                    console.error('Error generating insights:', error)
                    alert('Failed to generate insights')
                  } finally {
                    setInsightsLoading(false)
                  }
                }}
                disabled={insightsLoading}
                style={{
                  padding: '1rem 2rem',
                  background: insightsLoading
                    ? '#6c757d'
                    : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: insightsLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {insightsLoading ? 'Generating...' : '🔍 Generate Insights'}
              </button>
            </div>

            {/* Insights List */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
                Your Insights
              </h3>
              {userInsights.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💭</div>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    No insights yet. Generate your first weekly insights to get started!
                  </p>
                  <p style={{ fontSize: '0.9rem' }}>
                    Insights will help you understand your nutrition patterns and get personalized recommendations.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {userInsights.map((insight) => {
                    const isExpired = insight.expires_at ? new Date(insight.expires_at) < new Date() : false
                    const priorityColors = {
                      1: '#4caf50', // Low priority - green
                      2: '#ff9800', // Medium priority - orange
                      3: '#f44336'  // High priority - red
                    }

                    return (
                      <div key={insight.id} style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        border: `2px solid ${insight.is_read ? '#e9ecef' : priorityColors[insight.priority as keyof typeof priorityColors] || '#2196f3'}`,
                        opacity: isExpired ? 0.6 : 1,
                        position: 'relative'
                      }}>
                        {!insight.is_read && (
                          <div style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            width: '12px',
                            height: '12px',
                            background: priorityColors[insight.priority as keyof typeof priorityColors] || '#2196f3',
                            borderRadius: '50%'
                          }}></div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              color: '#1a3a2a',
                              marginBottom: '0.5rem'
                            }}>
                              {insight.title}
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              color: '#666',
                              lineHeight: '1.5'
                            }}>
                              {insight.description}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                              fontSize: '0.8rem',
                              color: '#666',
                              background: insight.insight_type === 'weekly_summary' ? '#e3f2fd' :
                                         insight.insight_type === 'recommendation' ? '#f3e5f5' :
                                         insight.insight_type === 'habit_nudge' ? '#fff3e0' : '#f5f5f5',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px'
                            }}>
                              {insight.insight_type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {new Date(insight.created_at).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span style={{ fontSize: '0.8rem', color: '#f44336', fontWeight: 'bold' }}>
                                EXPIRED
                              </span>
                            )}
                          </div>

                          {!insight.is_read && (
                            <button
                              onClick={async () => {
                                try {
                                  await markInsightAsRead(insight.id)
                                  await loadInsightsData()
                                } catch (error) {
                                  console.error('Error marking insight as read:', error)
                                }
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              Mark as Read ✓
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Habits Tab */}
        {activeTab === 'ai-insights' && aiInsightsSubTab === 'habits' && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              🔄 Nutrition Habits & Patterns
            </h2>

            {/* Habits Overview */}
            <div style={{
              background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                Your Nutrition Patterns
              </h3>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Discover recurring behaviors and habits in your nutrition journey
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                💡 Patterns are analyzed from your meal logging history
              </div>
            </div>

            {/* Habit Patterns List */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
                Detected Patterns
              </h3>
              {habitPatterns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    No patterns detected yet. Keep logging meals to uncover your habits!
                  </p>
                  <p style={{ fontSize: '0.9rem' }}>
                    Patterns will appear as you build your nutrition history
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {habitPatterns.map((pattern) => {
                    const getPatternIcon = (patternType: string) => {
                      switch (patternType) {
                        case 'skipped_meals': return '🚫🍽️'
                        case 'late_night_eating': return '🌙🍕'
                        case 'high_caffeine': return '☕⚡'
                        case 'low_hydration': return '💧📉'
                        case 'protein_focused': return '💪🥩'
                        case 'carb_heavy': return '🍞🍝'
                        case 'vegetarian_meals': return '🥕🥬'
                        case 'irregular_timing': return '⏰🔀'
                        default: return '🔄'
                      }
                    }

                    const getPatternColor = (frequency: number) => {
                      if (frequency >= 80) return '#f44336' // High frequency - red
                      if (frequency >= 60) return '#ff9800' // Medium-high - orange
                      if (frequency >= 40) return '#2196f3' // Medium - blue
                      return '#4caf50' // Low - green
                    }

                    const getPatternDescription = (patternType: string, frequency: number) => {
                      const descriptions: Record<string, string> = {
                        'skipped_meals': `You skip meals ${frequency}% of the time. Consider more regular eating patterns.`,
                        'late_night_eating': `You eat after 8 PM on ${frequency}% of days. This may affect sleep quality.`,
                        'high_caffeine': `High caffeine intake detected on ${frequency}% of days. Monitor for sleep impact.`,
                        'low_hydration': `Below-average hydration on ${frequency}% of days. Aim for 2000-3000ml daily.`,
                        'protein_focused': `Protein-focused meals ${frequency}% of the time. Great for muscle maintenance!`,
                        'carb_heavy': `Carbohydrate-heavy meals ${frequency}% of the time. Balance with proteins and fats.`,
                        'vegetarian_meals': `Vegetarian meals ${frequency}% of the time. Ensure adequate protein sources.`,
                        'irregular_timing': `Irregular meal timing ${frequency}% of the time. Consider establishing routines.`
                      }
                      return descriptions[patternType] || `Pattern detected with ${frequency}% frequency.`
                    }

                    return (
                      <div key={pattern.id} style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        border: `2px solid ${getPatternColor(pattern.frequency_score)}`,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          fontSize: '1.5rem'
                        }}>
                          {getPatternIcon(pattern.pattern_type)}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              color: '#1a3a2a',
                              marginBottom: '0.5rem',
                              textTransform: 'capitalize'
                            }}>
                              {pattern.pattern_type.replace('_', ' ')}
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              color: '#666',
                              lineHeight: '1.5'
                            }}>
                              {getPatternDescription(pattern.pattern_type, pattern.frequency_score)}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                              fontSize: '0.8rem',
                              color: '#666',
                              background: pattern.frequency_score >= 80 ? '#ffebee' :
                                         pattern.frequency_score >= 60 ? '#fff3e0' : '#e8f5e8',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px'
                            }}>
                              {pattern.frequency_score >= 80 ? 'HIGH' :
                               pattern.frequency_score >= 60 ? 'MEDIUM' : 'LOW'} IMPACT
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              Last detected: {pattern.last_detected ? new Date(pattern.last_detected).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>

                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: getPatternColor(pattern.frequency_score)
                          }}>
                            {pattern.frequency_score}%
                          </div>
                        </div>

                        {/* Frequency Bar */}
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#e0e0e0',
                          borderRadius: '4px',
                          marginTop: '1rem',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${pattern.frequency_score}%`,
                            height: '100%',
                            background: getPatternColor(pattern.frequency_score),
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pattern Analysis Tips */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              marginTop: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
                Understanding Your Patterns
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#1a3a2a', marginBottom: '0.5rem' }}>🔴 High Frequency</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Patterns occurring 80%+ of the time may need attention</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#1a3a2a', marginBottom: '0.5rem' }}>🟠 Medium Frequency</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>60-80% patterns are common and may be intentional</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#1a3a2a', marginBottom: '0.5rem' }}>🔵 Low Frequency</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>40-60% patterns are situational and flexible</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#1a3a2a', marginBottom: '0.5rem' }}>🟢 Very Low</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Below 40% patterns are rare occurrences</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Correlations Tab */}
        {activeTab === 'ai-insights' && aiInsightsSubTab === 'correlations' && (
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              📈 Health Metric Correlations
            </h2>

            {/* Correlations Overview */}
            <div style={{
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                Discover Relationships in Your Data
              </h3>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                See how different health metrics correlate with each other over time
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                💡 Strong correlations can reveal important health insights
              </div>
            </div>

            {/* Correlation Matrix */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
                Significant Correlations
              </h3>
              {metricCorrelations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                  <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    No significant correlations found yet. Keep logging data to uncover relationships!
                  </p>
                  <p style={{ fontSize: '0.9rem' }}>
                    Correlations require sufficient data points across multiple days
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {metricCorrelations.map((correlation) => {
                    const getCorrelationIcon = (metric1: string, metric2: string) => {
                      if (metric1.includes('sleep') || metric2.includes('sleep')) return '😴'
                      if (metric1.includes('hydration') || metric2.includes('hydration')) return '💧'
                      if (metric1.includes('caffeine') || metric2.includes('caffeine')) return '☕'
                      if (metric1.includes('protein') || metric2.includes('protein')) return '💪'
                      if (metric1.includes('calories') || metric2.includes('calories')) return '🔥'
                      return '📈'
                    }

                    const getCorrelationStrength = (coefficient: number) => {
                      const abs = Math.abs(coefficient)
                      if (abs >= 0.8) return { label: 'Very Strong', color: '#f44336' }
                      if (abs >= 0.6) return { label: 'Strong', color: '#ff9800' }
                      if (abs >= 0.4) return { label: 'Moderate', color: '#2196f3' }
                      if (abs >= 0.2) return { label: 'Weak', color: '#4caf50' }
                      return { label: 'Very Weak', color: '#9e9e9e' }
                    }

                    const strength = getCorrelationStrength(correlation.correlation_coefficient)
                    const isPositive = correlation.correlation_coefficient > 0

                    return (
                      <div key={correlation.id} style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        border: `2px solid ${strength.color}`,
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '1rem',
                          right: '1rem',
                          fontSize: '1.5rem'
                        }}>
                          {getCorrelationIcon(correlation.primary_metric, correlation.secondary_metric)}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              color: '#1a3a2a',
                              marginBottom: '0.5rem'
                            }}>
                              {correlation.primary_metric.replace('_', ' ')} ↔ {correlation.secondary_metric.replace('_', ' ')}
                            </div>
                            <div style={{
                              fontSize: '1rem',
                              color: '#666',
                              lineHeight: '1.5'
                            }}>
                              {isPositive ? 'Positive' : 'Negative'} correlation: When {correlation.primary_metric.replace('_', ' ')} {isPositive ? 'increases' : 'decreases'}, {correlation.secondary_metric.replace('_', ' ')} tends to {isPositive ? 'increase' : 'decrease'}.
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                              fontSize: '0.8rem',
                              color: strength.color,
                              background: strength.color + '20',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '12px',
                              fontWeight: 'bold'
                            }}>
                              {strength.label.toUpperCase()}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {correlation.sample_size} data points
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#666' }}>
                              {correlation.time_window_days} day window
                            </span>
                          </div>

                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: strength.color
                          }}>
                            {correlation.correlation_coefficient > 0 ? '+' : ''}{correlation.correlation_coefficient.toFixed(3)}
                          </div>
                        </div>

                        {/* Correlation Strength Bar */}
                        <div style={{
                          width: '100%',
                          height: '8px',
                          background: '#e0e0e0',
                          borderRadius: '4px',
                          marginTop: '1rem',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.abs(correlation.correlation_coefficient) * 100}%`,
                            height: '100%',
                            background: strength.color,
                            borderRadius: '4px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Correlation Interpretation Guide */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1.5rem' }}>
                Understanding Correlations
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#f44336', marginBottom: '0.5rem' }}>🔴 Strong Correlation (0.6-1.0)</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Metrics move together consistently. May indicate causal relationships.</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#ff9800', marginBottom: '0.5rem' }}>🟠 Moderate Correlation (0.4-0.6)</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Some relationship exists but other factors may be involved.</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#2196f3', marginBottom: '0.5rem' }}>🔵 Weak Correlation (0.2-0.4)</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Weak relationship, likely influenced by many other factors.</div>
                </div>
                <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                  <div style={{ fontWeight: 'bold', color: '#4caf50', marginBottom: '0.5rem' }}>🟢 Positive vs Negative</div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Positive: both increase together. Negative: one increases as the other decreases.</div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e8', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1a3a2a', marginBottom: '0.5rem' }}>
                  📊 Statistical Notes
                </h4>
                <ul style={{ fontSize: '0.9rem', color: '#666', margin: 0, paddingLeft: '1.5rem' }}>
                  <li>Correlations show relationships, not causation</li>
                  <li>p-values below 0.05 indicate statistical significance</li>
                  <li>More data points improve correlation reliability</li>
                  <li>External factors can influence relationships</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add/Edit Food Form Modal */}
      {(showAddFoodForm || editingFood) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1a3a2a',
              marginBottom: '1.5rem'
            }}>
              {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                if (editingFood) {
                  handleUpdateFood(editingFood.id, formData)
                } else {
                  handleCreateFood(formData)
                }
              }}
              style={{ display: 'grid', gap: '1rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Food Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingFood?.name || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Brand (optional)
                  </label>
                  <input
                    name="brand"
                    type="text"
                    defaultValue={editingFood?.brand || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Serving Size *
                  </label>
                  <input
                    name="serving_size"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={editingFood?.serving_size || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Serving Unit *
                  </label>
                  <select
                    name="serving_unit"
                    required
                    defaultValue={editingFood?.serving_unit || 'g'}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="g">grams (g)</option>
                    <option value="oz">ounces (oz)</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tablespoon</option>
                    <option value="tsp">teaspoon</option>
                    <option value="piece">piece</option>
                    <option value="slice">slice</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Calories per Serving *
                </label>
                <input
                  name="calories_per_serving"
                  type="number"
                  required
                  defaultValue={editingFood?.calories_per_serving || ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Protein (g) *
                  </label>
                  <input
                    name="protein_grams"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={editingFood?.protein_grams || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Carbs (g) *
                  </label>
                  <input
                    name="carbs_grams"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={editingFood?.carbs_grams || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Fat (g) *
                  </label>
                  <input
                    name="fat_grams"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={editingFood?.fat_grams || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Fiber (g) *
                  </label>
                  <input
                    name="fiber_grams"
                    type="number"
                    step="0.1"
                    required
                    defaultValue={editingFood?.fiber_grams || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Sugar (g)
                  </label>
                  <input
                    name="sugar_grams"
                    type="number"
                    step="0.1"
                    defaultValue={editingFood?.sugar_grams || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Sodium (mg)
                  </label>
                  <input
                    name="sodium_mg"
                    type="number"
                    defaultValue={editingFood?.sodium_mg || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFoodForm(false)
                    setEditingFood(null)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '500',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? 'Saving...' : (editingFood ? 'Update Food' : 'Add Food')}
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {/* Food Selector Modal */}
        {foodSelectorOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '2rem'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: '#1a3a2a'
                }}>
                  Select Food
                </h3>
                <button
                  onClick={() => {
                    setFoodSelectorOpen(false)
                    setFoodSelectorSearch('')
                  }}
                  style={{
                    padding: '0.5rem',
                    background: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Filter Tabs */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid #e9ecef',
                paddingBottom: '1rem'
              }}>
                <button
                  onClick={() => setFoodSelectorFilter('database')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: foodSelectorFilter === 'database' ? '#ff6b35' : '#f8f9fa',
                    color: foodSelectorFilter === 'database' ? '#fff' : '#1a3a2a',
                    border: '1px solid #e9ecef',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  🍎 Food Database
                </button>
                <button
                  onClick={() => setFoodSelectorFilter('templates')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: foodSelectorFilter === 'templates' ? '#ff6b35' : '#f8f9fa',
                    color: foodSelectorFilter === 'templates' ? '#fff' : '#1a3a2a',
                    border: '1px solid #e9ecef',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  📋 Meal Templates
                </button>
                <button
                  onClick={() => setFoodSelectorFilter('saved')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: foodSelectorFilter === 'saved' ? '#ff6b35' : '#f8f9fa',
                    color: foodSelectorFilter === 'saved' ? '#fff' : '#1a3a2a',
                    border: '1px solid #e9ecef',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  ⭐ Saved Foods
                </button>
                <button
                  onClick={() => setFoodSelectorFilter('usda')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: foodSelectorFilter === 'usda' ? '#ff6b35' : '#f8f9fa',
                    color: foodSelectorFilter === 'usda' ? '#fff' : '#1a3a2a',
                    border: '1px solid #e9ecef',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  🔍 USDA Search
                </button>
                <button
                  onClick={() => setFoodSelectorFilter('barcode')}
                  style={{
                    padding: '0.5rem 1rem',
                    background: foodSelectorFilter === 'barcode' ? '#ff6b35' : '#f8f9fa',
                    color: foodSelectorFilter === 'barcode' ? '#fff' : '#1a3a2a',
                    border: '1px solid #e9ecef',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  📱 Scan Barcode
                </button>
              </div>

              {/* Search */}
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={foodSelectorSearch}
                  onChange={(e) => setFoodSelectorSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Food List */}
              <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'grid',
                gap: '0.5rem'
              }}>
                {foodSelectorFilter === 'database' && foodItems
                  .filter(food =>
                    food.name.toLowerCase().includes(foodSelectorSearch.toLowerCase()) ||
                    (food.brand && food.brand.toLowerCase().includes(foodSelectorSearch.toLowerCase()))
                  )
                  .map((food) => (
                    <div
                      key={food.id}
                      onClick={() => foodSelectorContext === 'template' ? addFoodToTemplate(food) : addFoodToMeal(food)}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: '#f8f9fa',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#1a3a2a',
                            marginBottom: '0.25rem'
                          }}>
                            {food.name}
                          </div>
                          {food.brand && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#666',
                              marginBottom: '0.5rem'
                            }}>
                              {food.brand}
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#666'
                          }}>
                            {food.serving_size} {food.serving_unit} • {food.calories_per_serving} cal
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'right',
                          fontSize: '0.9rem',
                          color: '#666'
                        }}>
                          <div>P: {food.protein_grams}g</div>
                          <div>C: {food.carbs_grams}g</div>
                          <div>F: {food.fat_grams}g</div>
                        </div>
                      </div>
                    </div>
                  ))}

                {foodSelectorFilter === 'templates' && data.mealTemplates
                  .filter(template =>
                    template.name.toLowerCase().includes(foodSelectorSearch.toLowerCase())
                  )
                  .map((template) => (
                    <div
                      key={template.id}
                      onClick={() => addMealTemplateToMeal(template)}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: '#f8f9fa',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#1a3a2a',
                            marginBottom: '0.25rem'
                          }}>
                            📋 {template.name}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#666'
                          }}>
                            {template.total_calories} cal total
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {foodSelectorFilter === 'saved' && data.savedFoods
                  .filter(savedFood =>
                    savedFood.food_item?.name.toLowerCase().includes(foodSelectorSearch.toLowerCase()) ||
                    (savedFood.food_item?.brand && savedFood.food_item.brand.toLowerCase().includes(foodSelectorSearch.toLowerCase()))
                  )
                  .map((savedFood) => (
                    <div
                      key={savedFood.id}
                      onClick={() => addSavedFoodToMeal(savedFood)}
                      style={{
                        padding: '1rem',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: '#f8f9fa',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#1a3a2a',
                            marginBottom: '0.25rem'
                          }}>
                            ⭐ {savedFood.food_item?.name}
                          </div>
                          {savedFood.food_item?.brand && (
                            <div style={{
                              fontSize: '0.8rem',
                              color: '#666',
                              marginBottom: '0.5rem'
                            }}>
                              {savedFood.food_item.brand}
                            </div>
                          )}
                          <div style={{
                            fontSize: '0.8rem',
                            color: '#666'
                          }}>
                            {savedFood.food_item?.serving_size} {savedFood.food_item?.serving_unit} • {savedFood.food_item?.calories_per_serving} cal
                          </div>
                        </div>
                        <div style={{
                          textAlign: 'right',
                          fontSize: '0.9rem',
                          color: '#666'
                        }}>
                          <div>P: {savedFood.food_item?.protein_grams}g</div>
                          <div>C: {savedFood.food_item?.carbs_grams}g</div>
                          <div>F: {savedFood.food_item?.fat_grams}g</div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {((foodSelectorFilter === 'database' && foodItems.length === 0) ||
                (foodSelectorFilter === 'templates' && data.mealTemplates.length === 0) ||
                (foodSelectorFilter === 'saved' && data.savedFoods.length === 0) ||
                (foodSelectorFilter === 'usda' && false)) && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  {foodSelectorFilter === 'database' && 'No foods found. Try a different search term.'}
                  {foodSelectorFilter === 'templates' && 'No meal templates found. Create some templates first.'}
                  {foodSelectorFilter === 'saved' && 'No saved foods found. Save some foods from the database first.'}
                </div>
              )}

              {/* USDA Food Search */}
              {foodSelectorFilter === 'usda' && (
                <div style={{ padding: '1rem' }}>
                  <FoodSearch
                    onFoodSelect={async (usdaFood: USDAFoodItem) => {
                      if (foodSelectorContext === 'template') {
                        // For templates, save USDA food to database first, then add to template
                        try {
                          const formData = new FormData();
                          formData.append('name', usdaFood.description);
                          formData.append('brand', usdaFood.brandName || '');
                          formData.append('serving_size', usdaFood.nutrition.servingSizeGrams.toString());
                          formData.append('serving_unit', 'g');
                          formData.append('calories_per_serving', usdaFood.nutrition.calories.toString());
                          formData.append('protein_grams', usdaFood.nutrition.protein.toString());
                          formData.append('carbs_grams', usdaFood.nutrition.carbs.toString());
                          formData.append('fat_grams', usdaFood.nutrition.fat.toString());
                          formData.append('fiber_grams', usdaFood.nutrition.fiber.toString());
                          formData.append('sugar_grams', usdaFood.nutrition.sugar.toString());
                          formData.append('sodium_mg', usdaFood.nutrition.sodium.toString());

                          const result = await createFoodItem(formData);
                          if (result.success && result.data && result.data.id) {
                            // Add the newly saved food to the template
                            setTemplateForm(prev => ({
                              ...prev,
                              food_items: [...prev.food_items, { food_item_id: result.data!.id, quantity: usdaFood.nutrition.servingSizeGrams }]
                            }));
                            setFoodSelectorOpen(false);
                            setFoodSelectorSearch('');
                            // Refresh food items to include the new one
                            await loadFoodItems();
                          }
                        } catch (error) {
                          console.error('Error saving USDA food for template:', error);
                          alert('Failed to save food. It may already exist in your database.');
                        }
                      } else {
                        // For meal logging, convert USDA food to local format
                        const localFood: FoodItem = {
                          id: usdaFood.fdcId.toString(),
                          name: usdaFood.description,
                          brand: usdaFood.brandName,
                          serving_size: usdaFood.nutrition.servingSizeGrams,
                          serving_unit: 'g',
                          calories_per_serving: usdaFood.nutrition.calories,
                          protein_grams: usdaFood.nutrition.protein,
                          carbs_grams: usdaFood.nutrition.carbs,
                          fat_grams: usdaFood.nutrition.fat,
                          fiber_grams: usdaFood.nutrition.fiber,
                          sugar_grams: usdaFood.nutrition.sugar,
                          sodium_mg: usdaFood.nutrition.sodium,
                          created_at: new Date().toISOString()
                        };
                        setSelectedFoods(prev => [...prev, { food: localFood, quantity: usdaFood.nutrition.servingSizeGrams }]);
                      }
                    }}
                    placeholder="Search USDA food database..."
                  />
                </div>
              )}

              {/* Barcode Scanning */}
              {foodSelectorFilter === 'barcode' && (
                <div style={{ padding: '1rem' }}>
                  <BarcodeScanner
                    onFoodFound={(barcodeFood) => {
                      if (foodSelectorContext === 'template') {
                        // For templates, save barcode food to database first, then add to template
                        (async () => {
                          try {
                            const formData = new FormData();
                            formData.append('name', barcodeFood.product_name);
                            formData.append('brand', barcodeFood.brands || '');
                            formData.append('serving_size', barcodeFood.nutrition.servingSizeGrams.toString());
                            formData.append('serving_unit', 'g');
                            formData.append('calories_per_serving', barcodeFood.nutrition.calories.toString());
                            formData.append('protein_grams', barcodeFood.nutrition.protein.toString());
                            formData.append('carbs_grams', barcodeFood.nutrition.carbs.toString());
                            formData.append('fat_grams', barcodeFood.nutrition.fat.toString());
                            formData.append('fiber_grams', barcodeFood.nutrition.fiber.toString());
                            formData.append('sugar_grams', barcodeFood.nutrition.sugar.toString());
                            formData.append('sodium_mg', barcodeFood.nutrition.sodium.toString());

                            const result = await createFoodItem(formData);
                            if (result.success && result.data && result.data.id) {
                              // Add the newly saved food to the template
                              setTemplateForm(prev => ({
                                ...prev,
                                food_items: [...prev.food_items, { food_item_id: result.data!.id, quantity: barcodeFood.nutrition.servingSizeGrams }]
                              }));
                              setFoodSelectorOpen(false);
                              setFoodSelectorSearch('');
                              // Refresh food items to include the new one
                              await loadFoodItems();
                            }
                          } catch (error) {
                            console.error('Error saving barcode food for template:', error);
                            alert('Failed to save food. It may already exist in your database.');
                          }
                        })();
                      } else {
                        // For meal logging, convert barcode food to local format
                        const localFood: FoodItem = {
                          id: barcodeFood.code,
                          name: barcodeFood.product_name,
                          brand: barcodeFood.brands,
                          serving_size: barcodeFood.nutrition.servingSizeGrams,
                          serving_unit: 'g',
                          calories_per_serving: barcodeFood.nutrition.calories,
                          protein_grams: barcodeFood.nutrition.protein,
                          carbs_grams: barcodeFood.nutrition.carbs,
                          fat_grams: barcodeFood.nutrition.fat,
                          fiber_grams: barcodeFood.nutrition.fiber,
                          sugar_grams: barcodeFood.nutrition.sugar,
                          sodium_mg: barcodeFood.nutrition.sodium,
                          created_at: new Date().toISOString()
                        };
                        setSelectedFoods(prev => [...prev, { food: localFood, quantity: barcodeFood.nutrition.servingSizeGrams }]);
                      }
                    }}
                    onClose={() => setFoodSelectorFilter('database')}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meal Template Modal */}
        {showTemplateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1.5rem' }}>
                {editingTemplate ? 'Edit Meal Template' : 'Create Meal Template'}
              </h3>

              <form onSubmit={async (e) => {
                e.preventDefault()

                // Client-side validation
                if (!templateForm.name.trim()) {
                  alert('Please enter a template name')
                  return
                }

                if (templateForm.food_items.length === 0) {
                  alert('Please add at least one food item to the template')
                  return
                }

                const formData = new FormData(e.target as HTMLFormElement)
                formData.append('food_items', JSON.stringify(templateForm.food_items))

                try {
                  const result = editingTemplate
                    ? await updateMealTemplate(editingTemplate.id, formData)
                    : await createMealTemplate(formData, user!.id)

                  if (result.success) {
                    setShowTemplateModal(false)
                    setEditingTemplate(null)
                    setTemplateForm({
                      name: '',
                      meal_type: 'breakfast',
                      description: '',
                      food_items: []
                    })
                    alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!')
                    router.refresh()
                  } else {
                    alert('Failed to save template: ' + result.error)
                  }
                } catch (error) {
                  console.error('Error saving template:', error)
                  alert('Failed to save template')
                }
              }}>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Template Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        fontSize: '1rem'
                      }}
                      placeholder="e.g., Protein Pancakes"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Meal Type *
                    </label>
                    <select
                      name="meal_type"
                      value={templateForm.meal_type}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, meal_type: e.target.value as any }))}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        fontSize: '1rem'
                      }}
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6',
                        fontSize: '1rem',
                        minHeight: '80px'
                      }}
                      placeholder="Optional description..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                      Foods in this Template
                    </label>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                      {templateForm.food_items.map((item, index) => {
                        const food = data.foodItems.find(f => f.id === item.food_item_id)
                        return (
                          <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem',
                            background: '#f8f9fa',
                            borderRadius: '6px'
                          }}>
                            <span style={{ flex: 1 }}>
                              {food?.name || 'Unknown food'} 
                              <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: '0.5rem' }}>
                                ({(item.quantity / (food?.serving_size || 1)).toFixed(1)} servings)
                              </span>
                            </span>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...templateForm.food_items]
                                newItems[index].quantity = parseFloat(e.target.value) || 0
                                setTemplateForm(prev => ({ ...prev, food_items: newItems }))
                              }}
                              style={{ width: '80px', padding: '0.25rem' }}
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setTemplateForm(prev => ({
                                  ...prev,
                                  food_items: prev.food_items.filter((_, i) => i !== index)
                                }))
                              }}
                              style={{
                                padding: '0.25rem 0.5rem',
                                border: 'none',
                                background: '#dc3545',
                                color: '#fff',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFoodSelectorContext('template')
                        setFoodSelectorOpen(true)
                      }}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem 1rem',
                        border: '1px dashed #dee2e6',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      ➕ Add Food
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false)
                      setEditingTemplate(null)
                      setTemplateForm({
                        name: '',
                        meal_type: 'breakfast',
                        description: '',
                        food_items: []
                      })
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      border: '1px solid #dee2e6',
                      background: '#f8f9fa',
                      color: '#1a3a2a',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {showBarcodeScanner && (
          <BarcodeScanner
            onFoodFound={(food) => {
              setSelectedBarcodeFood(food)
              setShowBarcodeScanner(false)
            }}
            onClose={() => setShowBarcodeScanner(false)}
          />
        )}

      <Footer />
    </main>
  )
}