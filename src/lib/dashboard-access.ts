import { createClient } from '@/lib/supabase-server'

export async function checkDashboardAccess(dashboardName: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get the dashboard access settings
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'dashboard_access')
      .single()

    if (error || !settings) {
      // Default to enabled if no settings exist
      return true
    }

    const dashboardConfig = settings.setting_value[dashboardName]
    if (!dashboardConfig) {
      // Default to enabled if dashboard not configured
      return true
    }

    // Return whether the dashboard is enabled
    return dashboardConfig.enabled === true
  } catch (error) {
    console.error('Error checking dashboard access:', error)
    // Default to enabled on error
    return true
  }
}
