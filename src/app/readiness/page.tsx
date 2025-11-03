import ReadinessClient from '../../components/ReadinessClient'
import {
  getReadinessMetrics,
  getReadinessHistory,
  getLatestReadinessScore,
  ReadinessMetric
} from '@/lib/fitness-data'
import { createClient } from '@/lib/supabase-server'
import { checkDashboardAccess } from '@/lib/dashboard-access'
import { redirect } from 'next/navigation'

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

export const dynamic = 'force-dynamic'

export default async function ReadinessPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if readiness dashboard is accessible
  const hasAccess = await checkDashboardAccess('readiness')
  if (!hasAccess) {
    redirect('/dashboard')
  }

  const data = await getReadinessData()

  return <ReadinessClient initialData={data} />
}
