'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { getFoodItems, createFoodItem, updateFoodItem, deleteFoodItem, logMeal, deleteMeal, upsertNutritionGoal, createMealTemplate, updateMealTemplate, deleteMealTemplate, logMealFromTemplate, getMealTemplateWithItems } from '@/lib/fitness-data'

interface NutritionData {
  foodItems: any[]
  meals: any[]
  nutritionGoals: any[]
  mealTemplates: any[]
  dailyNutritionStats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }
}

interface FoodItem {
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
  created_at: string
}

interface NutritionClientProps {
  initialData: NutritionData
}

export default function NutritionClient({ initialData }: NutritionClientProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [data, setData] = useState<NutritionData>(initialData)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'foods' | 'meals' | 'templates' | 'log' | 'goals'>('dashboard')

  // Refresh data function
  const refreshNutritionData = async () => {
    try {
      // This would ideally call the server to get fresh data
      // For now, we'll update the local state when meals are logged
      // In a full implementation, you'd revalidate the page data
      window.location.reload() // Simple refresh for now
    } catch (error) {
      console.error('Error refreshing data:', error)
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
  const [dateFilter, setDateFilter] = useState('')
  const [mealsLoading, setMealsLoading] = useState(false)

  // Log Meal state
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [mealDate, setMealDate] = useState(new Date().toISOString().split('T')[0])
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

  // Food selector context
  const [foodSelectorContext, setFoodSelectorContext] = useState<'meal' | 'template'>('meal')

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

  // Load meals when meals tab is active
  useEffect(() => {
    if (activeTab === 'meals') {
      loadMeals()
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
          setData(prev => ({
            ...prev,
            meals: prev.meals.filter(meal => meal.id !== editingMealId).concat(newMeal),
            // Don't update dailyNutritionStats locally - let server revalidation handle it
            dailyNutritionStats: prev.dailyNutritionStats
          }))
        } else {
          // For new meals
          setData(prev => ({
            ...prev,
            meals: [newMeal, ...prev.meals],
            dailyNutritionStats: {
              ...prev.dailyNutritionStats,
              total_calories: prev.dailyNutritionStats.total_calories + (newMeal.total_calories || 0),
              total_protein: prev.dailyNutritionStats.total_protein + (newMeal.total_protein || 0),
              total_carbs: prev.dailyNutritionStats.total_carbs + (newMeal.total_carbs || 0),
              total_fat: prev.dailyNutritionStats.total_fat + (newMeal.total_fat || 0),
              total_fiber: prev.dailyNutritionStats.total_fiber + (newMeal.total_fiber || 0),
              meals_count: prev.dailyNutritionStats.meals_count + 1
            }
          }))
        }

        // Reset form
        setSelectedFoods([])
        setMealNotes('')
        setMealTime('')
        setEditingMealId(null)
        
        // Switch to meals tab to show the updated meal
        setActiveTab('meals')
        alert(editingMealId ? 'Meal updated successfully!' : 'Meal logged successfully!')
        // Refresh the page to get updated server data
        router.refresh()
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
          const mealToDelete = prev.meals.find(meal => meal.id === mealId)
          const isToday = mealToDelete && mealToDelete.meal_date === new Date().toISOString().split('T')[0]
          
          return {
            ...prev,
            meals: prev.meals.filter(meal => meal.id !== mealId),
            dailyNutritionStats: isToday ? {
              ...prev.dailyNutritionStats,
              total_calories: prev.dailyNutritionStats.total_calories - (mealToDelete?.total_calories || 0),
              total_protein: prev.dailyNutritionStats.total_protein - (mealToDelete?.total_protein || 0),
              total_carbs: prev.dailyNutritionStats.total_carbs - (mealToDelete?.total_carbs || 0),
              total_fat: prev.dailyNutritionStats.total_fat - (mealToDelete?.total_fat || 0),
              total_fiber: prev.dailyNutritionStats.total_fiber - (mealToDelete?.total_fiber || 0),
              meals_count: prev.dailyNutritionStats.meals_count - 1
            } : prev.dailyNutritionStats
          }
        })
      } else {
        alert('Failed to delete meal: ' + result.error)
      }
      // Refresh the page to get updated server data
      router.refresh()
    } catch (error) {
      console.error('Error deleting meal:', error)
      alert('Failed to delete meal')
    }
  }

  const handleEditMeal = async (meal: any) => {
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

  const handleGoalChange = (goalType: string, value: number) => {
    setGoalChanges(prev => ({
      ...prev,
      [goalType]: value
    }))
  }

  // Meal Template handlers
  const handleQuickLog = async (templateId: string) => {
    const today = new Date().toISOString().split('T')[0]
    try {
      const result = await logMealFromTemplate(templateId, today)
      if (result.success) {
        alert('Meal logged successfully!')
        // Refresh data
        router.refresh()
      } else {
        alert('Failed to log meal: ' + result.error)
      }
    } catch (error) {
      console.error('Error logging meal from template:', error)
      alert('Failed to log meal from template')
    }
  }

  const handleEditTemplate = async (template: any) => {
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
          food_items: items.map((item: any) => ({
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
            🍎 Nutrition Tracker
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
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'foods', label: 'Food Database', icon: '🥕' },
              { id: 'meals', label: 'Meal History', icon: '🍽️' },
              { id: 'templates', label: 'Meal Templates', icon: '📋' },
              { id: 'log', label: 'Log Meal', icon: '➕' },
              { id: 'goals', label: 'Goals', icon: '🎯' }
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
                  Goal: {data.nutritionGoals.find((g: any) => g.goal_type === 'daily_calories')?.target_value || 2200}
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
                  Goal: {data.nutritionGoals.find((g: any) => g.goal_type === 'protein_target')?.target_value || 150}g
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
                  Goal: {data.nutritionGoals.find((g: any) => g.goal_type === 'carb_target')?.target_value || 250}g
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
                  Goal: {data.nutritionGoals.find((g: any) => g.goal_type === 'fat_target')?.target_value || 70}g
                </p>
              </div>
            </div>

            {/* Link to Full Nutrition Page */}
            <div style={{
              textAlign: 'center',
              marginTop: '2rem'
            }}>
              <Link href="/nutrition" style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s'
              }}>
                🍎 Manage Nutrition
              </Link>
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
                .map((meal: any) => (
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
                          {meal.meal_type}
                        </h3>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {new Date(meal.meal_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                          {meal.meal_time && ` at ${meal.meal_time}`}
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right',
                        fontSize: '0.9rem',
                        color: '#666'
                      }}>
                        <div><strong>{Math.round(meal.total_calories)}</strong> calories</div>
                        <div>{Math.round(meal.total_protein)}g protein</div>
                      </div>
                    </div>

                    {/* Nutrition Breakdown */}
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
                              setMealDate(new Date().toISOString().split('T')[0])
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
                          {food.brand && `${food.brand} • `}{quantity} {food.serving_unit}
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
              {data.mealTemplates.map((template: any) => (
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

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '2rem' }}>
              🎯 Nutrition Goals
            </h2>

            <div style={{
              display: 'grid',
              gap: '2rem',
              maxWidth: '800px'
            }}>
              {/* Daily Calories Goal */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Daily Calories
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="number"
                    value={goalChanges.daily_calories ?? data.nutritionGoals.find((g: any) => g.goal_type === 'daily_calories')?.target_value ?? 2200}
                    onChange={(e) => handleGoalChange('daily_calories', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ fontSize: '1.1rem', color: '#666' }}>calories</span>
                </div>
              </div>

              {/* Protein Goal */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Daily Protein
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="number"
                    value={goalChanges.protein_target ?? data.nutritionGoals.find((g: any) => g.goal_type === 'protein_target')?.target_value ?? 150}
                    onChange={(e) => handleGoalChange('protein_target', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ fontSize: '1.1rem', color: '#666' }}>grams</span>
                </div>
              </div>

              {/* Carbs Goal */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Daily Carbs
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="number"
                    value={goalChanges.carb_target ?? data.nutritionGoals.find((g: any) => g.goal_type === 'carb_target')?.target_value ?? 250}
                    onChange={(e) => handleGoalChange('carb_target', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ fontSize: '1.1rem', color: '#666' }}>grams</span>
                </div>
              </div>

              {/* Fat Goal */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '2rem',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
                  Daily Fat
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="number"
                    value={goalChanges.fat_target ?? data.nutritionGoals.find((g: any) => g.goal_type === 'fat_target')?.target_value ?? 70}
                    onChange={(e) => handleGoalChange('fat_target', parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                  <span style={{ fontSize: '1.1rem', color: '#666' }}>grams</span>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={handleSaveGoals}
                  disabled={savingGoals}
                  style={{
                    padding: '1rem 2rem',
                    background: savingGoals
                      ? '#6c757d'
                      : 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    cursor: savingGoals ? 'not-allowed' : 'pointer',
                    opacity: savingGoals ? 0.7 : 1
                  }}
                >
                  {savingGoals ? 'Saving...' : 'Save Goals'}
                </button>
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
            zIndex: 1000,
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
                {foodItems
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
              </div>

              {foodItems.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  No foods found. Try a different search term.
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
                    : await createMealTemplate(formData)

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
                            <span style={{ flex: 1 }}>{food?.name || 'Unknown food'}</span>
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

      <Footer />
    </main>
  )
}