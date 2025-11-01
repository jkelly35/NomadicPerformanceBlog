import ReadinessClient from '../../components/ReadinessClient'
import {
  getReadinessMetrics,
  getReadinessHistory,
  getLatestReadinessScore,
  ReadinessMetric
} from '@/lib/fitness-data'

interface ReadinessData {
  latestReadiness: ReadinessMetric | null
  readinessHistory: ReadinessMetric[]
  todayMetrics: ReadinessMetric | null
}

async function getReadinessData(): Promise<ReadinessData> {
  // Get today's date in local timezone
  const today = (() => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })()

  const [latestReadiness, readinessHistory, todayMetrics] = await Promise.all([
    getLatestReadinessScore(),
    getReadinessHistory(30), // Last 30 days
    getReadinessMetrics(today)
  ])

  return {
    latestReadiness,
    readinessHistory,
    todayMetrics
  }
}

export default async function ReadinessPage() {
  const data = await getReadinessData()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Athlete Readiness</h1>
          <p className="mt-2 text-gray-600">
            Track your daily recovery and performance readiness
          </p>
        </div>

        <ReadinessClient
          initialData={data}
        />
      </div>
    </div>
  )
}
