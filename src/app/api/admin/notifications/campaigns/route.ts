import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/notifications/campaigns - List all notification campaigns
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // Get campaigns with template info
    const { data: campaigns, error } = await supabase
      .from('notification_campaigns')
      .select(`
        *,
        notification_templates (
          id,
          name,
          type,
          category
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Error in campaigns API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/notifications/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

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

    const { name, description, template_id, target_audience, scheduled_at } = body

    if (!name || !template_id) {
      return NextResponse.json({ error: 'Name and template_id are required' }, { status: 400 })
    }

    // Get admin record for created_by
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const { data: campaign, error } = await supabase
      .from('notification_campaigns')
      .insert({
        name,
        description,
        template_id,
        target_audience: target_audience || {},
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
        status: scheduled_at ? 'scheduled' : 'draft',
        created_by: adminUser?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating campaign:', error)
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error in campaigns API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
