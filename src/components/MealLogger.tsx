'use client'

import { useState, useEffect } from 'react'
import { FoodItem } from '@/lib/fitness-data'

interface MealLoggerProps {
  selectedMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  onMealTypeChange: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void
  foodItems: FoodItem[]
  onLogMeal: (mealData: any) => void
  onTabChange: (tab: string) => void
}

export default function MealLogger({
  selectedMealType,
  onMealTypeChange,
  foodItems,
  onLogMeal,
  onTabChange
}: MealLoggerProps) {
  const [mealDate, setMealDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [mealTime, setMealTime] = useState('')
  const [mealNotes, setMealNotes] = useState('')
  const [selectedFoods, setSelectedFoods] = useState<Array<{food: FoodItem, quantity: number}>>([])
  const [foodSelectorOpen, setFoodSelectorOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Set default time based on meal type
  useEffect(() => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes().toString().padStart(2, '0')

    switch (selectedMealType) {
      case 'breakfast':
        setMealTime('08:00')
        break
      case 'lunch':
        setMealTime('12:00')
        break
      case 'dinner':
        setMealTime('18:00')
        break
      case 'snack':
        setMealTime(`${hours}:${minutes}`)
        break
    }
  }, [selectedMealType])

  const filteredFoods = foodItems.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddFood = (food: FoodItem) => {
    setSelectedFoods(prev => [...prev, { food, quantity: 1 }])
    setFoodSelectorOpen(false)
    setSearchTerm('')
  }

  const handleRemoveFood = (index: number) => {
    setSelectedFoods(prev => prev.filter((_, i) => i !== index))
  }

  const handleQuantityChange = (index: number, quantity: number) => {
    setSelectedFoods(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: Math.max(0.1, quantity) } : item
    ))
  }

  const calculateTotals = () => {
    return selectedFoods.reduce((totals, { food, quantity }) => {
      const servingRatio = quantity / (food.serving_size || 1)
      return {
        calories: totals.calories + (food.calories_per_serving * servingRatio),
        protein: totals.protein + (food.protein_grams * servingRatio),
        carbs: totals.carbs + (food.carbs_grams * servingRatio),
        fat: totals.fat + (food.fat_grams * servingRatio),
        fiber: totals.fiber + (food.fiber_grams * servingRatio)
      }
    }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedFoods.length === 0) {
      alert('Please add at least one food item')
      return
    }

    const mealData = {
      meal_type: selectedMealType,
      meal_date: mealDate,
      meal_time: mealTime,
      notes: mealNotes,
      foods: selectedFoods.map(({ food, quantity }) => ({
        food_id: food.id,
        quantity
      }))
    }

    await onLogMeal(mealData)

    // Reset form
    setSelectedFoods([])
    setMealNotes('')
    setMealTime('')
  }

  const totals = calculateTotals()

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3a2a' }}>
          ➕ Log Meal
        </h2>
        <button
          onClick={() => onTabChange('dashboard')}
          style={{
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
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
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Meal Type *
                </label>
                <select
                  value={selectedMealType}
                  onChange={(e) => onMealTypeChange(e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    minHeight: '44px'
                  }}
                >
                  <option value="breakfast">🌅 Breakfast</option>
                  <option value="lunch">☀️ Lunch</option>
                  <option value="dinner">🌙 Dinner</option>
                  <option value="snack">🍿 Snack</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Date *
                </label>
                <input
                  type="date"
                  value={mealDate}
                  onChange={(e) => setMealDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    minHeight: '44px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Time
                </label>
                <input
                  type="time"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1.1rem',
                    minHeight: '44px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500'
                }}>
                  Notes
                </label>
                <textarea
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  placeholder="Optional notes about this meal..."
                  style={{
                    width: '100%',
                    padding: '1rem',
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

          {/* Food Selection */}
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
              Food Items
            </h3>

            {/* Add Food Button */}
            <button
              type="button"
              onClick={() => setFoodSelectorOpen(!foodSelectorOpen)}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#28a745',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '1rem'
              }}
            >
              + Add Food Item
            </button>

            {/* Food Selector */}
            {foodSelectorOpen && (
              <div style={{
                border: '1px solid #ddd',
                borderRadius: '6px',
                padding: '1rem',
                marginBottom: '1rem',
                background: '#fff'
              }}>
                <input
                  type="text"
                  placeholder="Search foods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }}
                />
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #eee',
                  borderRadius: '4px'
                }}>
                  {filteredFoods.slice(0, 10).map((food) => (
                    <button
                      key={food.id}
                      type="button"
                      onClick={() => handleAddFood(food)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 'bold' }}>{food.name}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        {food.calories_per_serving} cal per {food.serving_size}{food.serving_unit}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Foods */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#1a3a2a' }}>
                Selected Foods ({selectedFoods.length})
              </h4>

              {selectedFoods.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>
                  No foods selected yet. Click "Add Food Item" to get started.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {selectedFoods.map((item, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      background: '#fff',
                      borderRadius: '4px',
                      border: '1px solid #eee'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.food.name}</div>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {Math.round(item.food.calories_per_serving * item.quantity / (item.food.serving_size || 1))} cal
                        </div>
                      </div>

                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '80px',
                          padding: '0.25rem',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>
                        {item.food.serving_unit || 'serving'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveFood(index)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nutrition Summary */}
        {selectedFoods.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '2rem',
            color: '#fff',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Meal Nutrition Summary
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {Math.round(totals.calories)}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Calories</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {Math.round(totals.protein)}g
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Protein</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {Math.round(totals.carbs)}g
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Carbs</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {Math.round(totals.fat)}g
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Fat</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {Math.round(totals.fiber)}g
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Fiber</div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="submit"
            disabled={selectedFoods.length === 0}
            style={{
              padding: '1rem 2rem',
              background: selectedFoods.length > 0 ? '#28a745' : '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: selectedFoods.length > 0 ? 'pointer' : 'not-allowed',
              minHeight: '44px'
            }}
          >
            {selectedFoods.length > 0 ? '🍽️ Log Meal' : 'Add foods to log meal'}
          </button>
        </div>
      </form>
    </div>
  )
}
