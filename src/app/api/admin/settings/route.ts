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

    return NextResponse.json({ settings: settingsObject })
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return NextResponse.json({ error: 'Failed to fetch admin settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { setting_key, setting_value } = body

    if (!setting_key || setting_value === undefined) {
      return NextResponse.json({ error: 'setting_key and setting_value are required' }, { status: 400 })
    }

    // Check if user is main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can modify settings' }, { status: 403 })
    }

    // Update the setting
    const { data: updatedSetting, error: updateError } = await supabase
      .from('admin_settings')
      .upsert({
        setting_key,
        setting_value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single()

    if (updateError) {
      console.error('Error updating admin setting:', updateError)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    // Log the setting change
    try {
      await supabase.from('admin_logs').insert({
        admin_id: user.id,
        action: 'update_admin_setting',
        resource_type: 'admin_setting',
        resource_id: setting_key,
        details: {
          updated_by: user.email,
          old_value: null, // Could be enhanced to track old values
          new_value: setting_value
        }
      })
    } catch (logError) {
      console.log('Logging error (non-critical):', logError)
    }

    console.log(`Admin ${user.email} updated setting ${setting_key}`)

    return NextResponse.json({
      success: true,
      setting: updatedSetting,
      message: `Setting ${setting_key} updated successfully`
    })
  } catch (error) {
    console.error('Error updating admin setting:', error)
    return NextResponse.json({ error: 'Failed to update admin setting' }, { status: 500 })
  }
}
