'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar"
import Footer from "@/components/Footer"
import BottomNavigation from "@/components/BottomNavigation"
import InsightsDisplay from "@/components/InsightsDisplay"
import PerformancePredictionDisplay from "@/components/PerformancePredictionDisplay"
import TrainingOptimizationDisplay from "@/components/TrainingOptimizationDisplay"
import {
  NutritionTrendsChart,
  WorkoutVolumeChart,
  HealthMetricsChart,
  HydrationCaffeineChart
} from '@/components/Charts'
import {
  getNutritionTrends,
  getWorkoutTrends,
  getHealthMetricsTrends,
  getHydrationCaffeineTrends
} from '@/lib/fitness-data'

export default function AnalyticsClient() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workouts' | 'health' | 'hydration' | 'insights' | 'predictions'>('insights')
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30)
  const [loading, setLoading] = useState(true)

  // Data states
  const [nutritionData, setNutritionData] = useState<any[]>([])
  const [workoutData, setWorkoutData] = useState<any[]>([])
  const [healthData, setHealthData] = useState<any[]>([])
  const [hydrationData, setHydrationData] = useState<any[]>([])

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const [nutrition, workouts, health, hydration] = await Promise.all([
        getNutritionTrends(timeRange),
        getWorkoutTrends(timeRange),
        getHealthMetricsTrends(timeRange),
        getHydrationCaffeineTrends(timeRange)
      ])

      setNutritionData(nutrition)
      setWorkoutData(workouts)
      setHealthData(health)
      setHydrationData(hydration)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'insights', label: 'AI Insights', icon: '🧠' },
    { id: 'predictions', label: 'AI Predictions', icon: '🔮' },
    { id: 'nutrition', label: 'Nutrition Trends', icon: '📊' },
    { id: 'workouts', label: 'Workout Volume', icon: '💪' },
    { id: 'health', label: 'Health Metrics', icon: '❤️' },
    { id: 'hydration', label: 'Hydration & Caffeine', icon: '💧' }
  ]

  return (
    <main className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your progress and identify patterns in your fitness journey</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setTimeRange(days as 7 | 30 | 90)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  timeRange === days
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="space-y-8">
            {activeTab === 'insights' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h2>
                  <p className="text-gray-600">Personalized recommendations based on your fitness data patterns</p>
                </div>
                <InsightsDisplay showHeader={false} />
              </div>
            )}

            {activeTab === 'predictions' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">AI Performance Predictions</h2>
                  <p className="text-gray-600">Advanced analytics predicting your future performance and optimal training strategies</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PerformancePredictionDisplay showHeader={true} compact={false} />
                  <TrainingOptimizationDisplay showHeader={true} compact={false} />
                </div>
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Nutrition Trends</h2>
                  <p className="text-gray-600">Track your daily macronutrient intake over time</p>
                </div>
                <NutritionTrendsChart data={nutritionData} />

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(nutritionData.reduce((sum, day) => sum + day.calories, 0) / Math.max(nutritionData.filter(d => d.calories > 0).length, 1))} cal
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Calories</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(nutritionData.reduce((sum, day) => sum + day.protein, 0) / Math.max(nutritionData.filter(d => d.protein > 0).length, 1))}g
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Protein</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(nutritionData.reduce((sum, day) => sum + day.carbs, 0) / Math.max(nutritionData.filter(d => d.carbs > 0).length, 1))}g
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Carbs</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-pink-600">
                      {Math.round(nutritionData.reduce((sum, day) => sum + day.fat, 0) / Math.max(nutritionData.filter(d => d.fat > 0).length, 1))}g
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Fat</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'workouts' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Workout Volume</h2>
                  <p className="text-gray-600">Monitor your training frequency and intensity</p>
                </div>
                <WorkoutVolumeChart data={workoutData} />

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-blue-600">
                      {workoutData.reduce((sum, day) => sum + day.workouts, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Workouts</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(workoutData.reduce((sum, day) => sum + day.totalMinutes, 0) / Math.max(workoutData.filter(d => d.workouts > 0).length, 1))} min
                    </div>
                    <div className="text-sm text-gray-600">Avg Session Duration</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(workoutData.reduce((sum, day) => sum + day.totalCalories, 0) / Math.max(workoutData.filter(d => d.workouts > 0).length, 1))} cal
                    </div>
                    <div className="text-sm text-gray-600">Avg Calories Burned</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'health' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Health Metrics</h2>
                  <p className="text-gray-600">Track your body composition and vital signs</p>
                </div>
                <HealthMetricsChart data={healthData} />

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-orange-600">
                      {healthData.filter(d => d.weight).length > 0
                        ? `${Math.round(healthData.filter(d => d.weight).reduce((sum, d) => sum + (d.weight || 0), 0) / healthData.filter(d => d.weight).length)} lbs`
                        : 'No data'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Current Weight</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-purple-600">
                      {healthData.filter(d => d.bodyFat).length > 0
                        ? `${Math.round(healthData.filter(d => d.bodyFat).reduce((sum, d) => sum + (d.bodyFat || 0), 0) / healthData.filter(d => d.bodyFat).length)}%`
                        : 'No data'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Body Fat %</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-red-600">
                      {healthData.filter(d => d.restingHR).length > 0
                        ? `${Math.round(healthData.filter(d => d.restingHR).reduce((sum, d) => sum + (d.restingHR || 0), 0) / healthData.filter(d => d.restingHR).length)} bpm`
                        : 'No data'
                      }
                    </div>
                    <div className="text-sm text-gray-600">Resting Heart Rate</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hydration' && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Hydration & Caffeine</h2>
                  <p className="text-gray-600">Monitor your fluid intake and caffeine consumption</p>
                </div>
                <HydrationCaffeineChart data={hydrationData} />

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(hydrationData.reduce((sum, day) => sum + day.hydration, 0) / Math.max(hydrationData.filter(d => d.hydration > 0).length, 1))} ml
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Hydration</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(hydrationData.reduce((sum, day) => sum + day.caffeine, 0) / Math.max(hydrationData.filter(d => d.caffeine > 0).length, 1))} mg
                    </div>
                    <div className="text-sm text-gray-600">Avg Daily Caffeine</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNavigation />
      </div>
    </main>
  )
}
