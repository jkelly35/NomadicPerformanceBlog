// Whoop API Integration
// Documentation: https://developer.whoop.com/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const WHOOP_BASE_URL = 'https://api.prod.whoop.com/developer'

export async function connectWhoop(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.WHOOP_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Whoop client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/whoop/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://api.prod.whoop.com/oauth/oauth2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Whoop:', error)
    return { success: false, error: 'Failed to initiate Whoop connection' }
  }
}

export async function syncWhoopData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // Last 7 days

    // Fetch different data types
    const endpoints = [
      { type: 'recovery_score' as WearableDataType, endpoint: '/v1/recovery' },
      { type: 'sleep_duration' as WearableDataType, endpoint: '/v1/sleep' },
      { type: 'heart_rate_variability' as WearableDataType, endpoint: '/v1/sleep' },
      { type: 'strain_score' as WearableDataType, endpoint: '/v1/cycle' }
    ]

    for (const { type, endpoint } of endpoints) {
      try {
        const points = await fetchWhoopData(accessToken, endpoint, type)
        dataPoints.push(...points)
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Whoop:`, error)
        // Continue with other data types
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Whoop data:', error)
    return { success: false, error: 'Failed to sync Whoop data' }
  }
}

async function fetchWhoopData(accessToken: string, endpoint: string, dataType: WearableDataType): Promise<WearableDataPoint[]> {
  const response = await fetch(`${WHOOP_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Whoop API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const dataPoints: WearableDataPoint[] = []

  // Transform data based on endpoint type
  if (endpoint.includes('recovery')) {
    data.records?.forEach((recovery: any) => {
      dataPoints.push({
        timestamp: recovery.created_at,
        value: recovery.score.recovery_score,
        unit: 'score',
        source: 'whoop',
        dataType: 'recovery_score'
      })
    })
  } else if (endpoint.includes('sleep')) {
    data.records?.forEach((sleep: any) => {
      // Sleep duration
      dataPoints.push({
        timestamp: sleep.created_at,
        value: sleep.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60), // Convert to hours
        unit: 'hours',
        source: 'whoop',
        dataType: 'sleep_duration'
      })

      // HRV
      if (sleep.score.respiratory_rate) {
        dataPoints.push({
          timestamp: sleep.created_at,
          value: sleep.score.respiratory_rate,
          unit: 'breaths/min',
          source: 'whoop',
          dataType: 'respiratory_rate'
        })
      }
    })
  } else if (endpoint.includes('cycle')) {
    data.records?.forEach((cycle: any) => {
      // Strain score
      if (cycle.score.strain) {
        dataPoints.push({
          timestamp: cycle.created_at,
          value: cycle.score.strain,
          unit: 'score',
          source: 'whoop',
          dataType: 'strain_score'
        })
      }
    })
  }

  return dataPoints
}

export async function refreshWhoopToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.WHOOP_CLIENT_ID
    const clientSecret = process.env.WHOOP_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Whoop credentials not configured' }
    }

    const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in
    }
  } catch (error) {
    console.error('Error refreshing Whoop token:', error)
    return { error: 'Failed to refresh token' }
  }
}
