// Fitbit API Integration
// Documentation: https://dev.fitbit.com/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const FITBIT_BASE_URL = 'https://api.fitbit.com'
const FITBIT_SCOPES = [
  'activity',
  'heartrate',
  'location',
  'nutrition',
  'profile',
  'settings',
  'sleep',
  'social',
  'weight'
]

export async function connectFitbit(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.FITBIT_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Fitbit client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/fitbit/callback`
    const scope = FITBIT_SCOPES.join(' ')
    const state = crypto.randomUUID()

    const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Fitbit:', error)
    return { success: false, error: 'Failed to initiate Fitbit connection' }
  }
}

export async function syncFitbitData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

    // Fetch different data types
    const endpoints = [
      { type: 'heart_rate' as WearableDataType, endpoint: `/1/user/-/activities/heart/date/${date}/1d.json` },
      { type: 'steps' as WearableDataType, endpoint: `/1/user/-/activities/steps/date/${date}/1d.json` },
      { type: 'calories' as WearableDataType, endpoint: `/1/user/-/activities/calories/date/${date}/1d.json` },
      { type: 'sleep_duration' as WearableDataType, endpoint: `/1/user/-/sleep/date/${date}.json` },
      { type: 'weight' as WearableDataType, endpoint: `/1/user/-/body/log/weight/date/${date}.json` }
    ]

    for (const { type, endpoint } of endpoints) {
      try {
        const points = await fetchFitbitData(accessToken, endpoint, type)
        dataPoints.push(...points)
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Fitbit:`, error)
        // Continue with other data types
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Fitbit data:', error)
    return { success: false, error: 'Failed to sync Fitbit data' }
  }
}

async function fetchFitbitData(accessToken: string, endpoint: string, dataType: WearableDataType): Promise<WearableDataPoint[]> {
  const response = await fetch(`${FITBIT_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Fitbit API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const dataPoints: WearableDataPoint[] = []

  // Transform data based on endpoint type
  switch (dataType) {
    case 'heart_rate':
      if (data['activities-heart-intraday']?.dataset) {
        data['activities-heart-intraday'].dataset.forEach((point: any) => {
          dataPoints.push({
            timestamp: new Date(`${data['activities-heart'][0].dateTime}T${point.time}`).toISOString(),
            value: point.value,
            unit: 'bpm',
            source: 'fitbit',
            dataType: 'heart_rate'
          })
        })
      }
      break

    case 'steps':
      if (data['activities-steps-intraday']?.dataset) {
        data['activities-steps-intraday'].dataset.forEach((point: any) => {
          dataPoints.push({
            timestamp: new Date(`${data['activities-steps'][0].dateTime}T${point.time}`).toISOString(),
            value: point.value,
            unit: 'steps',
            source: 'fitbit',
            dataType: 'steps'
          })
        })
      }
      break

    case 'calories':
      if (data['activities-calories-intraday']?.dataset) {
        data['activities-calories-intraday'].dataset.forEach((point: any) => {
          dataPoints.push({
            timestamp: new Date(`${data['activities-calories'][0].dateTime}T${point.time}`).toISOString(),
            value: point.value,
            unit: 'kcal',
            source: 'fitbit',
            dataType: 'calories'
          })
        })
      }
      break

    case 'sleep_duration':
      if (data.sleep) {
        data.sleep.forEach((sleep: any) => {
          dataPoints.push({
            timestamp: sleep.startTime,
            value: sleep.duration / (1000 * 60), // Convert to minutes
            unit: 'minutes',
            source: 'fitbit',
            dataType: 'sleep_duration'
          })
        })
      }
      break

    case 'weight':
      if (data.weight) {
        data.weight.forEach((weight: any) => {
          dataPoints.push({
            timestamp: weight.date + 'T' + weight.time,
            value: weight.weight,
            unit: 'kg',
            source: 'fitbit',
            dataType: 'weight'
          })
        })
      }
      break
  }

  return dataPoints
}

export async function refreshFitbitToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.FITBIT_CLIENT_ID
    const clientSecret = process.env.FITBIT_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Fitbit credentials not configured' }
    }

    const auth = btoa(`${clientId}:${clientSecret}`)

    const response = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
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
    console.error('Error refreshing Fitbit token:', error)
    return { error: 'Failed to refresh token' }
  }
}
