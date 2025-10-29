'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  Workout,
  HealthMetric,
  Goal,
  UserStat,
  Meal,
  NutritionGoal,
  logWorkout,
  logMeal,
  updateHealthMetrics
} from '@/lib/fitness-data'

interface DashboardData {
  workouts: Workout[]
  healthMetrics: HealthMetric[]
  goals: Goal[]
  userStats: UserStat[]
  weeklyStats: { count: number; totalMinutes: number }
  meals: Meal[]
  nutritionGoals: NutritionGoal[]
  dailyNutritionStats: {
    total_calories: number
    total_protein: number
    total_carbs: number
    total_fat: number
    total_fiber: number
    meals_count: number
  }
}

function DashboardContent({ 
  data, 
  showWorkoutModal, 
  setShowWorkoutModal, 
  showMealModal, 
  setShowMealModal, 
  showHealthModal, 
  setShowHealthModal,
  onWorkoutSubmit,
  onMealSubmit,
  onHealthSubmit,
  isSubmitting
}: { 
  data: DashboardData
  showWorkoutModal: boolean
  setShowWorkoutModal: (show: boolean) => void
  showMealModal: boolean
  setShowMealModal: (show: boolean) => void
  showHealthModal: boolean
  setShowHealthModal: (show: boolean) => void
  onWorkoutSubmit: (formData: FormData) => Promise<void>
  onMealSubmit: (formData: FormData) => Promise<void>
  onHealthSubmit: (formData: FormData) => Promise<void>
  isSubmitting: boolean
}) {
  const { user } = useAuth()

  // Helper functions to get data
  const getStatValue = (statType: string) => {
    const stat = data.userStats.find(s => s.stat_type === statType)
    return stat?.value || 0
  }

  const getHealthMetric = (metricType: string) => {
    const metric = data.healthMetrics.find(m => m.metric_type === metricType)
    return metric?.value || 0
  }

  const getGoal = (goalType: string) => {
    return data.goals.find(g => g.goal_type === goalType)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      const diffTime = Math.abs(today.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return `${diffDays} days ago`
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <NavBar />

      {/* Hero Section */}
      <section style={{
        padding: '6rem 5vw 4rem',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
        color: '#fff',
        textAlign: 'center',
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            marginBottom: '1.5rem',
            letterSpacing: '0.05em'
          }}>
            Welcome Back, {user?.email?.split('@')[0]}!
          </h1>
          <p style={{
            fontSize: '1.3rem',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            Your personalized fitness journey awaits
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section style={{ padding: '4rem 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          {/* Welcome Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            color: '#fff',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '0.5rem'
            }}>
              Welcome back, {user?.email?.split('@')[0]}! 👋
            </h2>
            <p style={{
              fontSize: '1.2rem',
              opacity: 0.9,
              marginBottom: '1rem'
            }}>
              Ready to crush your fitness goals today?
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem'
              }}>
                🔥 Streak: {Math.round(getStatValue('streak_days'))} days
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontSize: '0.9rem'
              }}>
                🏔️ Next Adventure: Utah Hiking
              </div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Fitness Score */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {Math.round(getStatValue('fitness_score'))}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '0.5rem'
              }}>
                Fitness Score
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem'
              }}>
                Overall athletic readiness
              </p>
              <div style={{
                background: '#e9ecef',
                borderRadius: '10px',
                height: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                  height: '100%',
                  width: '85%',
                  borderRadius: '10px'
                }}></div>
              </div>
            </div>

            {/* Weekly Workouts */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {data.weeklyStats.count}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '0.5rem'
              }}>
                This Week
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem'
              }}>
                Workouts completed
              </p>
              <div style={{ fontSize: '0.8rem', color: '#28a745', fontWeight: 'bold' }}>
                +2 from last week ↑
              </div>
            </div>

            {/* Active Minutes */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {data.weeklyStats.totalMinutes}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '0.5rem'
              }}>
                Active Minutes
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem'
              }}>
                This week
              </p>
              <div style={{ fontSize: '0.8rem', color: '#007bff', fontWeight: 'bold' }}>
                Goal: 500 min
              </div>
            </div>

            {/* Recovery Score */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#fff'
              }}>
                {Math.round(getStatValue('recovery_score'))}
              </div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '0.5rem'
              }}>
                Recovery
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem'
              }}>
                Ready for training
              </p>
              <div style={{ fontSize: '0.8rem', color: '#28a745', fontWeight: 'bold' }}>
                Excellent condition
              </div>
            </div>
          </div>

          {/* Nutrition Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              🍎 Nutrition Tracking
            </h2>

            {/* Nutrition Metrics Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {/* Daily Calories */}
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
                  Calories Today
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Goal: {data.nutritionGoals.find(g => g.goal_type === 'daily_calories')?.target_value || 2200}
                </p>
              </div>

              {/* Protein */}
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
                  Goal: {data.nutritionGoals.find(g => g.goal_type === 'protein_target')?.target_value || 150}g
                </p>
              </div>

              {/* Carbs */}
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
                  Goal: {data.nutritionGoals.find(g => g.goal_type === 'carb_target')?.target_value || 250}g
                </p>
              </div>

              {/* Fat */}
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
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
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
                  Goal: {data.nutritionGoals.find(g => g.goal_type === 'fat_target')?.target_value || 70}g
                </p>
              </div>

              {/* Meals Logged */}
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
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#fff'
                }}>
                  {data.dailyNutritionStats.meals_count}
                </div>
                <h4 style={{
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  color: '#1a3a2a',
                  marginBottom: '0.5rem'
                }}>
                  Meals Today
                </h4>
                <p style={{
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  Logged meals
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
                marginBottom: '1.5rem'
              }}>
                Today&apos;s Meals
              </h3>
              {data.meals.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {data.meals.map((meal) => (
                    <div key={meal.id} style={{
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '1rem',
                      border: '1px solid #e9ecef',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: 600,
                          color: '#1a3a2a',
                          textTransform: 'capitalize',
                          marginBottom: '0.25rem'
                        }}>
                          {meal.meal_type}
                        </div>
                        {meal.notes && (
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {meal.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 600,
                          color: '#ff6b35',
                          fontSize: '1.1rem'
                        }}>
                          {meal.total_calories} cal
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          P:{meal.total_protein}g C:{meal.total_carbs}g F:{meal.total_fat}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
                  <p>No meals logged today. Start tracking your nutrition!</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '2rem',
            marginBottom: '2rem'
          }}>

            {/* Recent Activities */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🏃 Recent Activities
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                {data.workouts.length > 0 ? data.workouts.map((workout) => (
                  <div key={workout.id} style={{
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '1rem',
                    border: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#1a3a2a',
                        marginBottom: '0.25rem'
                      }}>
                        {workout.activity_type}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#666'
                      }}>
                        {formatDate(workout.workout_date)} • {workout.duration_minutes} min • {workout.calories_burned || 0} cal
                      </div>
                    </div>
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      background: workout.intensity === 'High' ? '#fee' :
                                 workout.intensity === 'Medium' ? '#fff3cd' : '#d1ecf1',
                      color: workout.intensity === 'High' ? '#c82333' :
                             workout.intensity === 'Medium' ? '#856404' : '#0c5460'
                    }}>
                      {workout.intensity}
                    </div>
                  </div>
                )) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666'
                  }}>
                    No workouts logged yet. Start your fitness journey!
                  </div>
                )}
              </div>
            </div>

            {/* Goals & Targets */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🎯 Goals
              </h3>

              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Weekly Workout Goal */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a3a2a' }}>
                      Weekly Workouts
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {(() => {
                        const goal = getGoal('weekly_workouts');
                        return goal ? `${Math.round(goal.current_value)}/${Math.round(goal.target_value)} completed` : '0/6 completed';
                      })()}
                    </span>
                  </div>
                  <div style={{
                    background: '#e9ecef',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      height: '100%',
                      width: `${(() => {
                        const goal = getGoal('weekly_workouts');
                        return goal ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
                      })()}%`,
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>

                {/* Monthly Active Minutes */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a3a2a' }}>
                      Monthly Active Minutes
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {(() => {
                        const goal = getGoal('monthly_minutes');
                        return goal ? `${Math.round(goal.current_value)}/${Math.round(goal.target_value)}` : '0/2000';
                      })()}
                    </span>
                  </div>
                  <div style={{
                    background: '#e9ecef',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #007bff 0%, #6610f2 100%)',
                      height: '100%',
                      width: `${(() => {
                        const goal = getGoal('monthly_minutes');
                        return goal ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
                      })()}%`,
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>

                {/* Strength Improvement */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1a3a2a' }}>
                      Strength Goals
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>
                      {(() => {
                        const goal = getGoal('strength_goals');
                        return goal ? `${Math.round(goal.current_value)}/${Math.round(goal.target_value)} achieved` : '0/4 achieved';
                      })()}
                    </span>
                  </div>
                  <div style={{
                    background: '#e9ecef',
                    borderRadius: '10px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%)',
                      height: '100%',
                      width: `${(() => {
                        const goal = getGoal('strength_goals');
                        return goal ? Math.min((goal.current_value / goal.target_value) * 100, 100) : 0;
                      })()}%`,
                      borderRadius: '10px'
                    }}></div>
                  </div>
                </div>
              </div>

              {/* Upcoming Goals */}
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#1a3a2a',
                  marginBottom: '1rem'
                }}>
                  Upcoming Challenges
                </h4>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{
                    background: '#fff',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    border: '1px solid #e9ecef',
                    fontSize: '0.85rem'
                  }}>
                    🏔️ <strong>14er Summit</strong> - 2 weeks
                  </div>
                  <div style={{
                    background: '#fff',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    border: '1px solid #e9ecef',
                    fontSize: '0.85rem'
                  }}>
                    🏃 10K Race - 3 weeks
                  </div>
                  <div style={{
                    background: '#fff',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    border: '1px solid #e9ecef',
                    fontSize: '0.85rem'
                  }}>
                    💪 PR Attempt - 1 month
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Recovery Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>

            {/* Health Metrics */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ❤️ Health Metrics
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a3a2a' }}>Resting HR</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Average bpm</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a3a2a' }}>
                    {Math.round(getHealthMetric('resting_hr'))}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a3a2a' }}>Sleep Quality</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Last night</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                    {Math.round(getHealthMetric('sleep_quality'))}%
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1a3a2a' }}>Body Fat</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>Estimated</div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a3a2a' }}>
                    {getHealthMetric('body_fat').toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Training Insights */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Training Insights
              </h3>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#155724'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    💪 Strength Improving
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    15% increase in max lifts this month
                  </div>
                </div>

                <div style={{
                  background: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#0c5460'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    🏃 Endurance Gaining
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    22% better recovery between sessions
                  </div>
                </div>

                <div style={{
                  background: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  padding: '1rem',
                  color: '#856404'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    ⚠️ Mobility Focus
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    Consider adding more flexibility work
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚡ Quick Actions
              </h3>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🏃 Log Workout
                </button>

                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#fff',
                  color: '#1a3a2a',
                  border: '2px solid #1a3a2a',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a2a';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#1a3a2a';
                }}
                >
                  📊 View Progress
                </button>

                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#fff',
                  color: '#1a3a2a',
                  border: '2px solid #1a3a2a',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a2a';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#1a3a2a';
                }}
                >
                  🎯 Set Goals
                </button>

                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#fff',
                  color: '#1a3a2a',
                  border: '2px solid #1a3a2a',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a3a2a';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#1a3a2a';
                }}
                >
                  📱 Connect Device
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating Action Button */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 1000
      }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowWorkoutModal(true)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Log Workout"
          >
            🏃‍♂️
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        left: '2rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setShowMealModal(true)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          🍎 Log Meal
        </button>
        <button
          onClick={() => setShowHealthModal(true)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '25px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap'
          }}
        >
          ❤️ Update Health
        </button>
      </div>

      {/* Workout Logging Modal */}
      {showWorkoutModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Log Workout</h2>
            <form action={onWorkoutSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Activity Type
                </label>
                <select 
                  name="activity_type" 
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select activity...</option>
                  <option value="Trail Running">Trail Running</option>
                  <option value="Strength Training">Strength Training</option>
                  <option value="Yoga & Mobility">Yoga & Mobility</option>
                  <option value="Hiking">Hiking</option>
                  <option value="Core Workout">Core Workout</option>
                  <option value="Cycling">Cycling</option>
                  <option value="Swimming">Swimming</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Duration (minutes)
                </label>
                <input 
                  type="number" 
                  name="duration_minutes" 
                  required 
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Calories Burned (optional)
                </label>
                <input 
                  type="number" 
                  name="calories_burned" 
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Intensity
                </label>
                <select 
                  name="intensity" 
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Notes (optional)
                </label>
                <textarea 
                  name="notes" 
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Logging...' : 'Log Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Logging Modal */}
      {showMealModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Log Meal</h2>
            <form action={onMealSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Meal Type
                </label>
                <select 
                  name="meal_type" 
                  required
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

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Total Calories
                </label>
                <input 
                  type="number" 
                  name="total_calories" 
                  required 
                  min="0"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Protein (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_protein" 
                    required 
                    min="0"
                    step="0.1"
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Carbs (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_carbs" 
                    required 
                    min="0"
                    step="0.1"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Fat (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_fat" 
                    required 
                    min="0"
                    step="0.1"
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
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Fiber (g)
                  </label>
                  <input 
                    type="number" 
                    name="total_fiber" 
                    required 
                    min="0"
                    step="0.1"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Notes (optional)
                </label>
                <textarea 
                  name="notes" 
                  rows={2}
                  placeholder="e.g., Greek yogurt with banana and almonds"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Logging...' : 'Log Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Health Metrics Modal */}
      {showHealthModal && (
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
          zIndex: 2000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#1a3a2a' }}>Update Health Metrics</h2>
            <form action={onHealthSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Resting Heart Rate (bpm)
                </label>
                <input 
                  type="number" 
                  name="resting_hr" 
                  min="40" 
                  max="120"
                  placeholder={getHealthMetric('resting_hr').toString() || '60'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Sleep Quality (%)
                </label>
                <input 
                  type="number" 
                  name="sleep_quality" 
                  min="0" 
                  max="100"
                  placeholder={getHealthMetric('sleep_quality').toString() || '85'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Body Fat (%)
                </label>
                <input 
                  type="number" 
                  name="body_fat" 
                  min="3" 
                  max="50" 
                  step="0.1"
                  placeholder={getHealthMetric('body_fat').toString() || '15'}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button"
                  onClick={() => setShowHealthModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Health'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Modal states
  const [showWorkoutModal, setShowWorkoutModal] = useState(false)
  const [showMealModal, setShowMealModal] = useState(false)
  const [showHealthModal, setShowHealthModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Form submission handlers
  const handleWorkoutSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await logWorkout(formData)
      if (result.success) {
        setShowWorkoutModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error logging workout: ' + result.error)
      }
    } catch (error) {
      alert('Error logging workout')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMealSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await logMeal(formData)
      if (result.success) {
        setShowMealModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error logging meal: ' + result.error)
      }
    } catch (error) {
      alert('Error logging meal')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleHealthSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateHealthMetrics(formData)
      if (result.success) {
        setShowHealthModal(false)
        // Refresh the page to show new data
        window.location.reload()
      } else {
        alert('Error updating health metrics')
      }
    } catch (error) {
      alert('Error updating health metrics')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #1a3a2a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#666' }}>Loading your dashboard...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardContent 
    data={data}
    showWorkoutModal={showWorkoutModal}
    setShowWorkoutModal={setShowWorkoutModal}
    showMealModal={showMealModal}
    setShowMealModal={setShowMealModal}
    showHealthModal={showHealthModal}
    setShowHealthModal={setShowHealthModal}
    onWorkoutSubmit={handleWorkoutSubmit}
    onMealSubmit={handleMealSubmit}
    onHealthSubmit={handleHealthSubmit}
    isSubmitting={isSubmitting}
  />
}
