'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

interface NutritionData {
  foodItems: any[]
  meals: any[]
  nutritionGoals: any[]
  dailyNutritionStats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }
}

interface NutritionClientProps {
  initialData: NutritionData
}

export default function NutritionClient({ initialData }: NutritionClientProps) {
  const { user } = useAuth()
  const router = useRouter()

  const [data] = useState<NutritionData>(initialData)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'foods' | 'meals' | 'log'>('dashboard')

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
              { id: 'log', label: 'Log Meal', icon: '➕' }
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
                  {data.dailyNutritionStats.total_calories}
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

            {/* Recent Meals */}
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
                marginBottom: '1rem'
              }}>
                Recent Meals
              </h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.meals.slice(0, 5).map((meal: any) => (
                  <div key={meal.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    background: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1a3a2a', textTransform: 'capitalize' }}>
                        {meal.meal_type}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {meal.total_calories} cal • {meal.total_protein}g protein
                      </div>
                      {meal.notes && (
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                          {meal.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {new Date(meal.meal_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {data.meals.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                    No meals logged yet. Start by logging your first meal!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'dashboard' && (
          <div style={{
            background: '#f8f9fa',
            borderRadius: '12px',
            padding: '3rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            border: '1px solid #e9ecef',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '1rem' }}>
              {activeTab === 'foods' && 'Food Database'}
              {activeTab === 'meals' && 'Meal History'}
              {activeTab === 'log' && 'Log Meal'}
            </h3>
            <p style={{ color: '#666' }}>
              This feature is coming soon! The dashboard view is working.
            </p>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
