import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('Users API - Auth check:', { user: user?.email, error: userError })

    if (userError || !user) {
      console.log('Users API - Not authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const isMainAdmin = user.email === 'joe@nomadicperformance.com'
    let isAuthorized = isMainAdmin

    // Check if user has admin role in database (for additional admins)
    if (!isMainAdmin) {
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

        // For main admin, try to get user information from available tables
    if (isMainAdmin) {
      try {
        // Try to get user count from user_preferences table
        const { data: userPrefs, error: prefsError } = await supabase
          .from('user_preferences')
          .select('user_id, first_name, last_name, created_at, updated_at')

        if (!prefsError && userPrefs) {
          // Get additional user info by joining with auth.users (this might not work due to RLS)
          // For now, return what we can get
          const users: Array<{
            id: string
            email: string
            created_at: string
            last_sign_in_at?: string
            first_name?: string | null
            last_name?: string | null
            is_current_user: boolean
          }> = userPrefs.map((pref: any) => ({
            id: pref.user_id,
            email: 'user@example.com', // Can't get email without admin privileges
            created_at: pref.created_at,
            last_sign_in_at: undefined,
            first_name: pref.first_name,
            last_name: pref.last_name,
            is_current_user: pref.user_id === user.id
          }))

          // Add current user if not in preferences
          if (!users.find((u: any) => u.id === user.id)) {
            users.push({
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at,
              first_name: null,
              last_name: null,
              is_current_user: true
            })
          }

          return NextResponse.json({
            users,
            note: 'Limited user data available without service role configuration'
          })
        }

        // Check if service role key is configured for full user access
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
          try {
            // Create admin client with service role key for full user access
            const adminSupabase = createAdminClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceRoleKey,
              {
                auth: {
                  autoRefreshToken: false,
                  persistSession: false
                }
              }
            )

            // Fetch all users from auth.users
            const { data: allUsers, error: usersError } = await adminSupabase.auth.admin.listUsers()

            if (!usersError && allUsers) {
              // Get user preferences for additional data
              const userIds = allUsers.users.map(u => u.id)
              const { data: userPrefs } = await supabase
                .from('user_preferences')
                .select('user_id, first_name, last_name')
                .in('user_id', userIds)

              // Combine auth users with preferences
              const users = allUsers.users.map(authUser => {
                const prefs = userPrefs?.find((p: any) => p.user_id === authUser.id)
                return {
                  id: authUser.id,
                  email: authUser.email || '',
                  created_at: authUser.created_at,
                  last_sign_in_at: authUser.last_sign_in_at,
                  is_current_user: authUser.id === user.id,
                  first_name: prefs?.first_name || null,
                  last_name: prefs?.last_name || null
                }
              })

              return NextResponse.json({
                users,
                total: allUsers.users.length,
                note: 'Real user data from Supabase Auth'
              })
            }
          } catch (adminError) {
            console.error('Error with admin client:', adminError)
            // Fall back to mock data if admin client fails
          }
        }

        // Fallback: return mock user data if service role key not configured or failed
        const mockUsers: Array<{
          id: string
          email: string
          created_at: string
          last_sign_in_at?: string
          is_current_user: boolean
          first_name?: string | null
          last_name?: string | null
        }> = [
          {
            id: user.id,
            email: user.email || '',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || undefined,
            is_current_user: true
          },
          {
            id: 'mock-user-1',
            email: 'demo@example.com',
            created_at: '2024-01-15T10:00:00Z',
            last_sign_in_at: '2024-11-01T14:30:00Z',
            is_current_user: false
          },
          {
            id: 'mock-user-2',
            email: 'test@example.com',
            created_at: '2024-02-20T09:15:00Z',
            last_sign_in_at: '2024-10-28T16:45:00Z',
            is_current_user: false
          }
        ]

        return NextResponse.json({
          users: mockUsers,
          note: serviceRoleKey ? 'Service role key configured but failed to fetch users' : 'Configure SERVICE_ROLE_KEY for real user data.'
        })
      } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({
          users: [
            {
              id: user.id,
              email: user.email || '',
              created_at: user.created_at,
              last_sign_in_at: user.last_sign_in_at || null,
              is_current_user: true
            }
          ],
          note: 'Error fetching users, showing current user only'
        })
      }
    }

    // For other admins, return limited information
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
    const supabase = await createClient()
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
      return NextResponse.json({ error: 'Not authorized - only main admin can delete users' }, { status: 403 })
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Check if service role key is configured
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({
        error: 'Service role key not configured',
        note: 'Configure SUPABASE_SERVICE_ROLE_KEY to enable user deletion'
      }, { status: 500 })
    }

    // Log the deletion attempt
    try {
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action: 'delete_user',
        resource_type: 'user',
        resource_id: userId,
        details: { deleted_by: user.email, target_user_id: userId }
      })
    } catch (logError) {
      console.log('Logging error (non-critical):', logError)
    }

    // Create admin client and delete user
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({
        error: 'Failed to delete user',
        details: deleteError.message
      }, { status: 500 })
    }

    console.log(`Admin ${user.email} successfully deleted user ${userId}`)

    return NextResponse.json({
      success: true,
      message: `User ${userId} has been deleted successfully`
    })
  } catch (error) {
    console.error('Error processing user deletion:', error)
    return NextResponse.json({ error: 'Failed to process user deletion' }, { status: 500 })
  }
}
