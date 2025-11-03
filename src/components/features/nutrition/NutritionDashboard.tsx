'use client'

import { useState } from 'react'
import { FoodItem, Meal, MealTemplate, NutritionGoal, SavedFood, HydrationLog, CaffeineLog, Micronutrient, UserInsight, HabitPattern, MetricCorrelation } from '@/lib/fitness-data'

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

interface NutritionDashboardProps {
  data: NutritionData
  onTabChange: (tab: string) => void
  onMealTypeSelect: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void
  onShowBarcodeScanner: () => void
  onLogHydration: (amount: number) => void
}

export default function NutritionDashboard({
  data,
  onTabChange,
  onMealTypeSelect,
  onShowBarcodeScanner,
  onLogHydration
}: NutritionDashboardProps) {
  return (
    <div>
      {/* Quick Actions Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem 1rem',
        marginBottom: '2rem',
        color: '#fff',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 4vw, 1.8rem)',
          fontWeight: 700,
          marginBottom: '1rem',
          color: '#fff'
        }}>
          🚀 Quick Actions
        </h2>
        <p style={{
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          marginBottom: '1.5rem',
          opacity: 0.9
        }}>
          What would you like to do today?
        </p>

        {/* Quick Meal Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 20vw, 140px), 1fr))',
          gap: 'clamp(0.5rem, 2vw, 1rem)',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => {
              onMealTypeSelect('breakfast')
              onTabChange('log')
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem)',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            🌅 Breakfast
          </button>
          <button
            onClick={() => {
              onMealTypeSelect('lunch')
              onTabChange('log')
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem)',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            ☀️ Lunch
          </button>
          <button
            onClick={() => {
              onMealTypeSelect('dinner')
              onTabChange('log')
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem)',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            🌙 Dinner
          </button>
          <button
            onClick={() => {
              onMealTypeSelect('snack')
              onTabChange('log')
            }}
            style={{
              padding: 'clamp(0.75rem, 3vw, 1rem)',
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: 'clamp(0.9rem, 3vw, 1rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backdropFilter: 'blur(10px)',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            🍿 Snack
          </button>
        </div>

        {/* Secondary Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 25vw, 160px), 1fr))',
          gap: 'clamp(0.5rem, 2vw, 1rem)',
          justifyItems: 'center'
        }}>
          <button
            onClick={onShowBarcodeScanner}
            style={{
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 4vw, 1.5rem)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '25px',
              color: '#fff',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '40px',
              width: '100%',
              maxWidth: '160px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            📱 Scan Barcode
          </button>
          <button
            onClick={() => onTabChange('usda-search')}
            style={{
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 4vw, 1.5rem)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '25px',
              color: '#fff',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '40px',
              width: '100%',
              maxWidth: '160px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            🔍 Search Foods
          </button>
          <button
            onClick={() => {
              const amount = prompt('Quick hydration log (ml):', '500')
              if (amount && !isNaN(parseInt(amount))) {
                onLogHydration(parseInt(amount))
              }
            }}
            style={{
              padding: 'clamp(0.5rem, 2vw, 0.75rem) clamp(1rem, 4vw, 1.5rem)',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '25px',
              color: '#fff',
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '40px',
              width: '100%',
              maxWidth: '160px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            💧 Log Water
          </button>
        </div>
      </div>

      <h2 style={{
        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
        fontWeight: 700,
        color: '#1a3a2a',
        marginBottom: '1.5rem'
      }}>
        Today's Nutrition
      </h2>

      {/* Consolidated Nutrition Card */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: 'clamp(1.5rem, 5vw, 2rem)',
        marginBottom: '2rem',
        color: '#fff'
      }}>
        <h3 style={{
          fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
          fontWeight: 600,
          marginBottom: '1.5rem',
          textAlign: 'center',
          color: '#fff'
        }}>
          🍎 Today's Macros
        </h3>

        {/* Calories - Main Focus */}
        <div style={{
          textAlign: 'center',
          marginBottom: '1.5rem',
          padding: 'clamp(0.75rem, 3vw, 1rem)',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            fontSize: 'clamp(2rem, 8vw, 2.5rem)',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {Math.round(data.dailyNutritionStats.total_calories)}
          </div>
          <div style={{
            fontSize: 'clamp(0.9rem, 3vw, 1rem)',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '0.5rem'
          }}>
            Calories
          </div>
          <div style={{
            fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
            color: 'rgba(255,255,255,0.6)'
          }}>
            Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'daily_calories')?.target_value || 2200}
          </div>
        </div>

        {/* Macro Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 20vw, 120px), 1fr))',
          gap: 'clamp(0.5rem, 2vw, 1rem)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: 'clamp(0.75rem, 2.5vw, 1rem)',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {Math.round(data.dailyNutritionStats.total_protein)}g
            </div>
            <div style={{
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '0.25rem'
            }}>
              Protein
            </div>
            <div style={{
              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'protein_target')?.target_value || 150}g
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 'clamp(0.75rem, 2.5vw, 1rem)',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {Math.round(data.dailyNutritionStats.total_carbs)}g
            </div>
            <div style={{
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '0.25rem'
            }}>
              Carbs
            </div>
            <div style={{
              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'carb_target')?.target_value || 250}g
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 'clamp(0.75rem, 2.5vw, 1rem)',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {Math.round(data.dailyNutritionStats.total_fat)}g
            </div>
            <div style={{
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '0.25rem'
            }}>
              Fat
            </div>
            <div style={{
              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Goal: {data.nutritionGoals.find((g: NutritionGoal) => g.goal_type === 'fat_target')?.target_value || 70}g
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: 'clamp(0.75rem, 2.5vw, 1rem)',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.25rem'
            }}>
              {Math.round(data.dailyNutritionStats.total_fiber)}g
            </div>
            <div style={{
              fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
              color: 'rgba(255,255,255,0.8)',
              marginBottom: '0.25rem'
            }}>
              Fiber
            </div>
            <div style={{
              fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
              color: 'rgba(255,255,255,0.6)'
            }}>
              Goal: 25g
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
