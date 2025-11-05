'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

interface NutritionProgressTabProps {
  userId: string
}

interface ProgressData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  meals: number
  hydration: number
  caffeine: number
}

const COLORS = ['#ff6b35', '#f7931e', '#4ade80', '#3b82f6', '#8b5cf6']

export default function NutritionProgressTab({ userId }: NutritionProgressTabProps) {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProgressData()
  }, [timeRange])

  const loadProgressData = async () => {
    setIsLoading(true)
    try {
      // TODO: Load actual progress data from database
      // For now, generate mock data
      const mockData: ProgressData[] = []
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90

      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i)
        mockData.push({
          date: format(date, 'yyyy-MM-dd'),
          calories: Math.floor(Math.random() * 500) + 1800,
          protein: Math.floor(Math.random() * 50) + 100,
          carbs: Math.floor(Math.random() * 100) + 200,
          fat: Math.floor(Math.random() * 30) + 60,
          fiber: Math.floor(Math.random() * 15) + 20,
          meals: Math.floor(Math.random() * 3) + 2,
          hydration: Math.floor(Math.random() * 500) + 1500,
          caffeine: Math.floor(Math.random() * 200) + 50
        })
      }

      setProgressData(mockData)
    } catch (error) {
      console.error('Error loading progress data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getWeeklyAverages = () => {
    const weeks = []
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 })

    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(startDate, i * 7)
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

      const weekData = progressData.filter(d => {
        const date = new Date(d.date)
        return date >= weekStart && date <= weekEnd
      })

      if (weekData.length > 0) {
        weeks.push({
          week: `Week ${4 - i}`,
          calories: Math.round(weekData.reduce((sum, d) => sum + d.calories, 0) / weekData.length),
          protein: Math.round(weekData.reduce((sum, d) => sum + d.protein, 0) / weekData.length),
          hydration: Math.round(weekData.reduce((sum, d) => sum + d.hydration, 0) / weekData.length)
        })
      }
    }

    return weeks
  }

  const getMacroDistribution = () => {
    if (progressData.length === 0) return []

    const latest = progressData[progressData.length - 1]
    const total = latest.protein * 4 + latest.carbs * 4 + latest.fat * 9 // Convert to calories

    return [
      { name: 'Protein', value: Math.round((latest.protein * 4 / total) * 100), calories: latest.protein * 4 },
      { name: 'Carbs', value: Math.round((latest.carbs * 4 / total) * 100), calories: latest.carbs * 4 },
      { name: 'Fat', value: Math.round((latest.fat * 9 / total) * 100), calories: latest.fat * 9 }
    ]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nutrition Progress</h2>
          <p className="text-gray-600">Track your nutrition trends over time</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Avg Daily Calories</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(progressData.reduce((sum, d) => sum + d.calories, 0) / progressData.length)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Avg Protein (g)</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(progressData.reduce((sum, d) => sum + d.protein, 0) / progressData.length)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Avg Hydration (ml)</div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(progressData.reduce((sum, d) => sum + d.hydration, 0) / progressData.length)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-600">Meals Logged</div>
          <div className="text-2xl font-bold text-gray-900">
            {progressData.reduce((sum, d) => sum + d.meals, 0)}
          </div>
        </div>
      </div>

      {/* Calories Trend Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Calories Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="calories"
              stroke="#ff6b35"
              strokeWidth={2}
              name="Calories"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Macronutrients Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Macronutrient Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="protein"
              stroke="#4ade80"
              strokeWidth={2}
              name="Protein (g)"
            />
            <Line
              type="monotone"
              dataKey="carbs"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Carbs (g)"
            />
            <Line
              type="monotone"
              dataKey="fat"
              stroke="#f7931e"
              strokeWidth={2}
              name="Fat (g)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Comparison and Macro Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Averages */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Averages</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={getWeeklyAverages()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calories" fill="#ff6b35" name="Calories" />
              <Bar dataKey="protein" fill="#4ade80" name="Protein (g)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Macro Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Day Macro Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={getMacroDistribution()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {getMacroDistribution().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}%`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hydration and Caffeine Trends */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hydration & Caffeine Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="hydration"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Hydration (ml)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="caffeine"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Caffeine (mg)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
