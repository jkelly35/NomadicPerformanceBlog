import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/analytics/engagement - Get user engagement metrics
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const { data: engagement, error: engagementError } = await supabase
      .rpc('get_user_engagement_metrics', { days_back: days })

    if (engagementError) {
      console.error('Error fetching user engagement metrics:', engagementError)
      return NextResponse.json({ error: 'Failed to fetch engagement metrics' }, { status: 500 })
    }

    return NextResponse.json({ engagement: engagement[0] })

  } catch (error) {
    console.error('Error in GET /api/analytics/engagement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
