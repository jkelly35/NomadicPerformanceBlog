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
    let adminSettingsExist = false

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

        // Check if admin_settings table exists
        const { data: settingsData, error: settingsError } = await supabase
          .from('admin_settings')
          .select('id')
          .limit(1)

        adminSettingsExist = !settingsError
      }
    } catch (e) {
      tablesExist = false
      adminUserExists = false
      adminSettingsExist = false
    }

    if (tablesExist && adminUserExists && adminSettingsExist) {
      return NextResponse.json({
        message: 'Admin system is fully configured',
        schemaExists: true,
        adminUserExists: true,
        adminSettingsExist: true
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
    if (tablesExist && !adminUserExists) {
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
          adminUserExists: true,
          adminSettingsExist: adminSettingsExist
        })
      } catch (insertError) {
        console.error('Error inserting admin user:', insertError)
        return NextResponse.json({
          error: 'Failed to insert main admin user',
          details: insertError
        }, { status: 500 })
      }
    }

    // Tables and admin user exist but admin_settings don't - create them
    if (tablesExist && adminUserExists && !adminSettingsExist) {
      try {
        // Insert default dashboard settings
        const { error: settingsError } = await supabase
          .from('admin_settings')
          .insert({
            setting_key: 'dashboard_access',
            setting_value: {
              nutrition: { enabled: true, locked: false },
              training: { enabled: true, locked: false },
              activities: { enabled: true, locked: false },
              equipment: { enabled: true, locked: false }
            },
            description: 'Controls which dashboards are enabled and locked for users'
          })

        if (settingsError) {
          console.error('Error creating admin settings:', settingsError)
          return NextResponse.json({
            error: 'Failed to create admin settings',
            details: settingsError.message
          }, { status: 500 })
        }

        return NextResponse.json({
          message: 'Admin settings created successfully',
          schemaExists: true,
          adminUserExists: true,
          adminSettingsExist: true
        })
      } catch (settingsError) {
        console.error('Error creating admin settings:', settingsError)
        return NextResponse.json({
          error: 'Failed to create admin settings',
          details: settingsError
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error checking admin setup:', error)
    return NextResponse.json({ error: 'Failed to check admin setup' }, { status: 500 })
  }
}
