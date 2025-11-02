// Oura Ring API Integration
// Documentation: https://cloud.ouraring.com/docs/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const OURA_BASE_URL = 'https://api.ouraring.com/v2'

export async function connectOura(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.OURA_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Oura client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/oura/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://cloud.ouraring.com/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Oura:', error)
    return { success: false, error: 'Failed to initiate Oura connection' }
  }
}

export async function syncOuraData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // Last 7 days
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch different data types
    const endpoints = [
      { type: 'sleep_duration' as WearableDataType, endpoint: `/usercollection/sleep?start_date=${startDateStr}` },
      { type: 'heart_rate_variability' as WearableDataType, endpoint: `/usercollection/daily_readiness?start_date=${startDateStr}` },
      { type: 'body_temperature' as WearableDataType, endpoint: `/usercollection/daily_readiness?start_date=${startDateStr}` },
      { type: 'readiness_score' as WearableDataType, endpoint: `/usercollection/daily_readiness?start_date=${startDateStr}` }
    ]

    for (const { type, endpoint } of endpoints) {
      try {
        const points = await fetchOuraData(accessToken, endpoint, type)
        dataPoints.push(...points)
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Oura:`, error)
        // Continue with other data types
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Oura data:', error)
    return { success: false, error: 'Failed to sync Oura data' }
  }
}

async function fetchOuraData(accessToken: string, endpoint: string, dataType: WearableDataType): Promise<WearableDataPoint[]> {
  const response = await fetch(`${OURA_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Oura API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const dataPoints: WearableDataPoint[] = []

  // Transform data based on endpoint type
  if (endpoint.includes('sleep')) {
    data.data?.forEach((sleep: any) => {
      // Sleep duration
      dataPoints.push({
        timestamp: sleep.bedtime_start,
        value: sleep.total_sleep_duration,
        unit: 'hours',
        source: 'oura',
        dataType: 'sleep_duration'
      })

      // Sleep quality score
      if (sleep.sleep_efficiency) {
        dataPoints.push({
          timestamp: sleep.bedtime_start,
          value: sleep.sleep_efficiency,
          unit: 'score',
          source: 'oura',
          dataType: 'sleep_quality'
        })
      }

      // HRV data
      if (sleep.average_hrv) {
        dataPoints.push({
          timestamp: sleep.bedtime_start,
          value: sleep.average_hrv,
          unit: 'ms',
          source: 'oura',
          dataType: 'heart_rate_variability'
        })
      }
    })
  } else if (endpoint.includes('readiness')) {
    data.data?.forEach((readiness: any) => {
      // Readiness score
      if (readiness.score) {
        dataPoints.push({
          timestamp: readiness.day,
          value: readiness.score,
          unit: 'score',
          source: 'oura',
          dataType: 'readiness_score'
        })
      }

      // Body temperature
      if (readiness.body_temperature?.temperature_delta) {
        dataPoints.push({
          timestamp: readiness.day,
          value: readiness.body_temperature.temperature_delta,
          unit: '°C',
          source: 'oura',
          dataType: 'body_temperature'
        })
      }
    })
  }

  return dataPoints
}

export async function refreshOuraToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.OURA_CLIENT_ID
    const clientSecret = process.env.OURA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Oura credentials not configured' }
    }

    const response = await fetch('https://api.ouraring.com/oauth/token', {
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
    console.error('Error refreshing Oura token:', error)
    return { error: 'Failed to refresh token' }
  }
}
