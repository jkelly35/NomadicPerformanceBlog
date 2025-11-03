import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is the main admin (joe@nomadicperformance.com)
    const isMainAdmin = user.email === 'joe@nomadicperformance.com'

    // Check if user has admin role in database
    let isDatabaseAdmin = false
    let adminUser = null

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      isDatabaseAdmin = !error && data !== null
      adminUser = data
    } catch (dbError) {
      // Table might not exist yet, treat as not a database admin
      console.log('Admin users table not found or error:', dbError)
      isDatabaseAdmin = false
    }

    const isAdmin = isMainAdmin || isDatabaseAdmin

    return NextResponse.json({
      isAdmin,
      isMainAdmin,
      isDatabaseAdmin,
      user: {
        id: user.id,
        email: user.email,
        role: adminUser?.role || (isMainAdmin ? 'super_admin' : null),
        permissions: adminUser?.permissions || (isMainAdmin ? {
          read: true,
          write: true,
          delete: true,
          manage_users: true
        } : null)
      }
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
