import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/analytics/dashboard - Get dashboard overview metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { data: dashboard, error: dashboardError } = await supabase
      .from('analytics_dashboard')
      .select('*')
      .single()

    if (dashboardError) {
      console.error('Error fetching dashboard metrics:', dashboardError)
      return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 })
    }

    return NextResponse.json({ dashboard })

  } catch (error) {
    console.error('Error in GET /api/analytics/dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
