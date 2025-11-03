import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is the main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can setup admin schema' }, { status: 403 })
    }

    // Check if admin tables already exist by trying to query them
    let tablesExist = false
    let adminUserExists = false

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1)

      tablesExist = !error

      if (tablesExist) {
        // Check if main admin user exists
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .single()

        adminUserExists = !adminError && adminData !== null
      }
    } catch (e) {
      tablesExist = false
      adminUserExists = false
    }

    if (tablesExist && adminUserExists) {
      return NextResponse.json({
        message: 'Admin system is fully configured',
        schemaExists: true,
        adminUserExists: true
      })
    }

    if (!tablesExist) {
      // Provide instructions for manual setup
      return NextResponse.json({
        message: 'Admin setup required',
        schemaExists: false,
        adminUserExists: false,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to the SQL Editor',
          '3. Run the contents of admin_schema.sql file',
          '4. This will create admin_users and admin_logs tables with proper permissions',
          '5. Return here and refresh to insert the main admin user'
        ],
        sqlFile: 'admin_schema.sql'
      })
    }

    // Tables exist but admin user doesn't - insert the main admin user
    try {
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          user_id: user.id,
          role: 'super_admin',
          permissions: {
            read: true,
            write: true,
            delete: true,
            manage_users: true
          }
        })

      if (insertError) {
        console.error('Error inserting admin user:', insertError)
        return NextResponse.json({
          error: 'Failed to insert main admin user',
          details: insertError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Main admin user inserted successfully',
        schemaExists: true,
        adminUserExists: true
      })
    } catch (insertError) {
      console.error('Error inserting admin user:', insertError)
      return NextResponse.json({
        error: 'Failed to insert main admin user',
        details: insertError
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error checking admin setup:', error)
    return NextResponse.json({ error: 'Failed to check admin setup' }, { status: 500 })
  }
}
