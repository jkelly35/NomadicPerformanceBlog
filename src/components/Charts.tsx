'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import { useState, useEffect } from 'react'

interface NutritionTrendData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface WorkoutTrendData {
  date: string
  workouts: number
  totalMinutes: number
  totalCalories: number
}

interface HealthMetricData {
  date: string
  weight?: number
  bodyFat?: number
  restingHR?: number
  sleepQuality?: number
}

export function NutritionTrendsChart({ data }: { data: NutritionTrendData[] }) {
  return (
    <div className="w-full h-80 bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrition Trends</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [
              `${value}${name === 'calories' ? ' cal' : 'g'}`,
              name.charAt(0).toUpperCase() + name.slice(1)
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="calories"
            stroke="#ff6b35"
            strokeWidth={2}
            dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="protein"
            stroke="#4caf50"
            strokeWidth={2}
            dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="carbs"
            stroke="#ff9800"
            strokeWidth={2}
            dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="fat"
            stroke="#e91e63"
            strokeWidth={2}
            dot={{ fill: '#e91e63', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function WorkoutVolumeChart({ data }: { data: WorkoutTrendData[] }) {
  return (
    <div className="w-full h-80 bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Workout Volume</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [
              name === 'workouts' ? `${value} workouts` :
              name === 'totalMinutes' ? `${value} min` :
              `${value} cal`,
              name === 'workouts' ? 'Workouts' :
              name === 'totalMinutes' ? 'Duration' :
              'Calories Burned'
            ]}
          />
          <Legend />
          <Bar dataKey="workouts" fill="#2196f3" name="workouts" />
          <Bar dataKey="totalMinutes" fill="#4caf50" name="totalMinutes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HealthMetricsChart({ data }: { data: HealthMetricData[] }) {
  return (
    <div className="w-full h-80 bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Metrics</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [
              name === 'weight' ? `${value} lbs` :
              name === 'bodyFat' ? `${value}%` :
              name === 'restingHR' ? `${value} bpm` :
              `${value}/10`,
              name === 'weight' ? 'Weight' :
              name === 'bodyFat' ? 'Body Fat %' :
              name === 'restingHR' ? 'Resting HR' :
              'Sleep Quality'
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#ff6b35"
            strokeWidth={2}
            dot={{ fill: '#ff6b35', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="bodyFat"
            stroke="#9c27b0"
            strokeWidth={2}
            dot={{ fill: '#9c27b0', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="restingHR"
            stroke="#f44336"
            strokeWidth={2}
            dot={{ fill: '#f44336', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function HydrationCaffeineChart({ data }: { data: Array<{ date: string, hydration: number, caffeine: number }> }) {
  return (
    <div className="w-full h-80 bg-white rounded-lg p-4 shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Hydration & Caffeine</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleDateString()}
            formatter={(value: number, name: string) => [
              `${value}${name === 'hydration' ? ' ml' : ' mg'}`,
              name === 'hydration' ? 'Hydration' : 'Caffeine'
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="hydration"
            stackId="1"
            stroke="#2196f3"
            fill="#2196f3"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="caffeine"
            stackId="2"
            stroke="#ff6b35"
            fill="#ff6b35"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
