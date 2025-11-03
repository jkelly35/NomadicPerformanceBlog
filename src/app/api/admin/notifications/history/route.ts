import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/notifications/history - Get communication history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isMainAdmin = user.email === 'joe@nomadicperformance.com'
    let isAuthorized = isMainAdmin

    if (!isMainAdmin) {
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      isAuthorized = adminUser !== null
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const userId = searchParams.get('user_id')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('user_communication_history')
      .select(`
        *,
        notifications (
          id,
          campaign_id,
          template_id,
          subject,
          status,
          sent_at,
          notification_templates (
            name,
            type,
            category
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: history, error, count } = await query

    if (error) {
      console.error('Error fetching communication history:', error)
      return NextResponse.json({ error: 'Failed to fetch communication history' }, { status: 500 })
    }

    return NextResponse.json({
      history,
      pagination: {
        limit,
        offset,
        has_more: (offset + limit) < (count || 0)
      }
    })
  } catch (error) {
    console.error('Error in communication history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
