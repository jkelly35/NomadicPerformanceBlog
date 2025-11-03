import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/notifications/send - Send notification(s)
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

    const { user_ids, send_to_all, segment_filters, campaign_id, template_id, subject, message, type, metadata } = body

    if (!send_to_all && !user_ids && !segment_filters) {
      return NextResponse.json({ error: 'user_ids, send_to_all, or segment_filters are required' }, { status: 400 })
    }

    if (!message || !type) {
      return NextResponse.json({ error: 'message and type are required' }, { status: 400 })
    }

    let targetUserIds: string[] = []

    if (send_to_all) {
      // Get all user IDs from user_preferences table
      const { data: allUsers, error: usersError } = await supabase
        .from('user_preferences')
        .select('user_id')

      if (usersError) {
        console.error('Error fetching all users:', usersError)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
      }

      targetUserIds = allUsers?.map(u => u.user_id) || []
    } else if (segment_filters) {
      // Apply segment filters to get targeted users
      let query = supabase
        .from('user_preferences')
        .select('user_id, dietary_preferences, activities')

      // Apply filters based on segment_filters
      if (segment_filters.dietary_preferences && segment_filters.dietary_preferences.length > 0) {
        query = query.overlaps('dietary_preferences', segment_filters.dietary_preferences)
      }

      if (segment_filters.activities && segment_filters.activities.length > 0) {
        query = query.overlaps('activities', segment_filters.activities)
      }

      const { data: segmentUsers, error: segmentError } = await query

      if (segmentError) {
        console.error('Error fetching segment users:', segmentError)
        return NextResponse.json({ error: 'Failed to fetch segment users' }, { status: 500 })
      }

      targetUserIds = segmentUsers?.map(u => u.user_id) || []
    } else if (user_ids) {
      // Use provided user IDs
      targetUserIds = Array.isArray(user_ids) ? user_ids : (user_ids as string).split(',').map((id: string) => id.trim()).filter((id: string) => id)
    }

    if (targetUserIds.length === 0) {
      return NextResponse.json({ error: 'No valid users found for the specified criteria' }, { status: 400 })
    }

    // Validate user_ids exist (for non-send_to_all cases)
    if (!send_to_all) {
      const { data: validUsers, error: userCheckError } = await supabase
        .from('user_preferences')
        .select('user_id')
        .in('user_id', targetUserIds)

      if (userCheckError) {
        console.error('Error validating users:', userCheckError)
        return NextResponse.json({ error: 'Failed to validate users' }, { status: 500 })
      }

      const validUserIds = validUsers?.map(u => u.user_id) || []
      const invalidUserIds = targetUserIds.filter(id => !validUserIds.includes(id))

      if (invalidUserIds.length > 0) {
        return NextResponse.json({
          error: `Invalid user IDs: ${invalidUserIds.join(', ')}`
        }, { status: 400 })
      }
    }

    // Send notifications using the database function
    const sentNotifications = []
    const maxBatchSize = 50 // Limit batch size to prevent timeouts

    for (let i = 0; i < targetUserIds.length; i += maxBatchSize) {
      const batch = targetUserIds.slice(i, i + maxBatchSize)

      for (const userId of batch) {
        try {
          const { data: notificationId, error: sendError } = await supabase
            .rpc('log_notification_send', {
              p_user_id: userId,
              p_campaign_id: campaign_id || null,
              p_template_id: template_id || null,
              p_type: type,
              p_subject: subject || null,
              p_message: message,
              p_metadata: metadata || {}
            })

          if (sendError) {
            console.error(`Error sending to user ${userId}:`, sendError)
            continue
          }

          sentNotifications.push({
            user_id: userId,
            notification_id: notificationId
          })
        } catch (error) {
          console.error(`Failed to send notification to user ${userId}:`, error)
        }
      }
    }

    // Update campaign stats if this was part of a campaign
    if (campaign_id) {
      const { error: updateError } = await supabase
        .from('notification_campaigns')
        .update({
          sent_count: sentNotifications.length,
          status: 'sent',
          sent_at: new Date()
        })
        .eq('id', campaign_id)

      if (updateError) {
        console.error('Error updating campaign stats:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      sent_count: sentNotifications.length,
      total_requested: targetUserIds.length,
      send_to_all,
      segment_filters,
      notifications: sentNotifications
    })
  } catch (error) {
    console.error('Error in send notification API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
