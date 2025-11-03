import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import SkeletonLoader from '@/components/SkeletonLoader'
import { checkDashboardAccess } from '@/lib/dashboard-access'

// Dynamically import the AnalyticsClient component
const AnalyticsClient = dynamic(() => import('@/components/AnalyticsClient'), {
  loading: () => <SkeletonLoader type="nutrition" />
})

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if analytics dashboard is accessible
  const hasAccess = await checkDashboardAccess('analytics')
  if (!hasAccess) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={<SkeletonLoader type="nutrition" />}>
      <AnalyticsClient />
    </Suspense>
  )
}
