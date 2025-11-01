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

  return <ReadinessClient initialData={data} />
}
