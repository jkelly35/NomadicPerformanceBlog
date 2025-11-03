import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const isMainAdmin = user.email === 'joe@nomadicperformance.com'

    let isAuthorized = isMainAdmin

    if (!isMainAdmin) {
      // Check database admin status
      try {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single()

        isAuthorized = adminUser !== null
      } catch (dbError) {
        // Table might not exist, only main admin can access
        console.log('Admin users table not found or error:', dbError)
        isAuthorized = false
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // For security, we'll return limited user information
    // In a real application, you'd have proper admin APIs in Supabase
    const users = [
      {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        is_current_user: true
      }
    ]

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if user is main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Note: In Supabase, deleting users requires admin privileges
    // This is a placeholder - actual user deletion would need proper admin setup
    console.log(`Admin ${user.email} requested deletion of user ${userId}`)

    // Log the action
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'delete_user',
      resource_type: 'user',
      resource_id: userId,
      details: { deleted_by: user.email }
    })

    return NextResponse.json({ success: true, message: 'User deletion logged' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
