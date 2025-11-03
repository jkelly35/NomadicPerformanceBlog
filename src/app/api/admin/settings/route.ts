import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can access settings' }, { status: 403 })
    }

    // Get admin settings
    const { data: settings, error: settingsError } = await supabase
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
    const supabase = await createClient()
    const body = await request.json()
    const { dashboardSettings } = body

    if (!dashboardSettings) {
      return NextResponse.json({ error: 'dashboardSettings is required' }, { status: 400 })
    }

    // Check if user is main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can modify settings' }, { status: 403 })
    }

    // Update the dashboard access settings
    const { data: updatedSetting, error: updateError } = await supabase
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
      return NextResponse.json({ error: 'Failed to update dashboard settings' }, { status: 500 })
    }

    // Log the setting change
    try {
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action: 'update_dashboard_access',
        resource_type: 'admin_setting',
        resource_id: 'dashboard_access',
        details: {
          updated_by: user.email,
          dashboard_settings: dashboardSettings
        }
      })
    } catch (logError) {
      console.log('Logging error (non-critical):', logError)
    }

    console.log(`Admin ${user.email} updated dashboard access settings`)

    return NextResponse.json({
      success: true,
      setting: updatedSetting,
      message: 'Dashboard settings updated successfully'
    })
  } catch (error) {
    console.error('Error updating dashboard settings:', error)
    return NextResponse.json({ error: 'Failed to update dashboard settings' }, { status: 500 })
  }
}
