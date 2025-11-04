import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// POST /api/analytics/events - Record analytics events
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const {
      event_type,
      event_data = {},
      session_id,
      url,
      referrer,
      user_agent
    } = body

    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    // Get client IP (this will be the server IP, but we can try to get from headers)
    const ip_address = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1'

    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type,
        event_data,
        user_id: user?.id || null,
        session_id,
        url,
        referrer,
        user_agent,
        ip_address
      })

    if (error) {
      console.error('Error recording analytics event:', error)
      return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in POST /api/analytics/events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
