import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    // Check if user is main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can access settings' }, { status: 403 })
    }

    // Get admin settings (use admin client to bypass RLS)
    const { data: settings, error: settingsError } = await adminSupabase
      .from('admin_settings')
      .select('*')

    if (settingsError) {
      console.error('Error fetching admin settings:', settingsError)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Convert settings array to object for easier consumption
    const settingsObject: Record<string, any> = {}
    settings.forEach(setting => {
      settingsObject[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        updated_at: setting.updated_at
      }
    })

    // Extract dashboard access settings for the SettingsTab
    const dashboardSettings = settingsObject.dashboard_access?.value || {
      nutrition: { enabled: true, locked: false },
      training: { enabled: true, locked: false },
      activities: { enabled: true, locked: false },
      equipment: { enabled: true, locked: false },
      goals: { enabled: true, locked: false },
      analytics: { enabled: true, locked: false },
      readiness: { enabled: true, locked: false }
    }

    return NextResponse.json({ settings: dashboardSettings })
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json({ error: 'Failed to fetch admin settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting dashboard settings update...')
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()
    const body = await request.json()
    const { dashboardSettings } = body

    console.log('Received dashboard settings:', dashboardSettings)

    if (!dashboardSettings) {
      console.log('No dashboardSettings provided')
      return NextResponse.json({ error: 'dashboardSettings is required' }, { status: 400 })
    }

    // Check if user is main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log('Authentication failed:', userError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      console.log('Unauthorized user:', user.email)
      return NextResponse.json({ error: 'Not authorized - only main admin can modify settings' }, { status: 403 })
    }

    console.log('User authenticated:', user.email)

    // Ensure the admin user exists in admin_users table (use admin client to bypass RLS)
    let adminUser = null;
    try {
      const { data: existingAdmin, error: adminCheckError } = await adminSupabase
        .from('admin_users')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!adminCheckError && existingAdmin) {
        adminUser = existingAdmin;
        console.log('Found existing admin user:', adminUser.id)
      } else {
        console.log('Admin check error or no admin user found:', adminCheckError)
      }
    } catch (checkError) {
      console.log('Admin user check exception (non-critical):', checkError);
    }

    if (!adminUser) {
      try {
        console.log('Creating new admin user...')
        const { data: newAdminUser, error: createAdminError } = await adminSupabase
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
          .select('id')
          .single()

        if (createAdminError) {
          console.error('Error creating admin user:', createAdminError)
          // Don't fail the whole request - continue without admin user for now
          console.log('Continuing without admin user creation...')
        } else {
          adminUser = newAdminUser;
          console.log('Created new admin user:', adminUser.id)
        }
      } catch (createError) {
        console.error('Exception creating admin user:', createError)
        // Don't fail the whole request
        console.log('Continuing without admin user creation...')
      }
    }

    // Update the dashboard access settings (use admin client to bypass RLS)
    console.log('Updating dashboard settings...')
    const { data: updatedSetting, error: updateError } = await adminSupabase
      .from('admin_settings')
      .upsert({
        setting_key: 'dashboard_access',
        setting_value: dashboardSettings,
        description: 'Global dashboard access controls for all users',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single()

    if (updateError) {
      console.error('Error updating dashboard settings:', updateError)
      return NextResponse.json({
        error: 'Failed to update dashboard settings',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('Dashboard settings updated successfully:', updatedSetting)

    // Log the setting change (only if we have an admin user)
    if (adminUser) {
      try {
        await supabase.from('admin_logs').insert({
          admin_id: adminUser.id,
          action: 'update_dashboard_access',
          resource_type: 'admin_setting',
          resource_id: 'dashboard_access',
          details: {
            updated_by: user.email,
            dashboard_settings: dashboardSettings
          }
        })
        console.log('Logged dashboard settings change')
      } catch (logError) {
        console.log('Logging error (non-critical):', logError)
      }
    } else {
      console.log('Skipping logging - no admin user')
    }

    console.log(`Admin ${user.email} updated dashboard access settings`)

    return NextResponse.json({
      success: true,
      setting: updatedSetting,
      message: 'Dashboard settings updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in dashboard settings update:', error)
    return NextResponse.json({
      error: 'Failed to update dashboard settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
