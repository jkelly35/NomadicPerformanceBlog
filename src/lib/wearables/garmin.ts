// Garmin Connect API Integration
// Documentation: https://developer.garmin.com/gc-developer-program/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const GARMIN_BASE_URL = 'https://apis.garmin.com'

export async function connectGarmin(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.GARMIN_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Garmin client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/garmin/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://connect.garmin.com/oauthConfirm?` +
      `clientId=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Garmin:', error)
    return { success: false, error: 'Failed to initiate Garmin connection' }
  }
}

export async function syncGarminData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7) // Last 7 days
    const startDateStr = startDate.toISOString().split('T')[0]

    // Fetch different data types
    const endpoints = [
      { type: 'heart_rate' as WearableDataType, endpoint: `/wellness-api/rest/dailies?uploadStartTimeInSeconds=${Math.floor(startDate.getTime() / 1000)}` },
      { type: 'steps' as WearableDataType, endpoint: `/wellness-api/rest/dailies?uploadStartTimeInSeconds=${Math.floor(startDate.getTime() / 1000)}` },
      { type: 'calories' as WearableDataType, endpoint: `/wellness-api/rest/dailies?uploadStartTimeInSeconds=${Math.floor(startDate.getTime() / 1000)}` },
      { type: 'sleep_duration' as WearableDataType, endpoint: `/wellness-api/rest/sleeps?uploadStartTimeInSeconds=${Math.floor(startDate.getTime() / 1000)}` },
      { type: 'training_load' as WearableDataType, endpoint: `/wellness-api/rest/trainingStatus?uploadStartTimeInSeconds=${Math.floor(startDate.getTime() / 1000)}` }
    ]

    for (const { type, endpoint } of endpoints) {
      try {
        const points = await fetchGarminData(accessToken, endpoint, type)
        dataPoints.push(...points)
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Garmin:`, error)
        // Continue with other data types
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Garmin data:', error)
    return { success: false, error: 'Failed to sync Garmin data' }
  }
}

async function fetchGarminData(accessToken: string, endpoint: string, dataType: WearableDataType): Promise<WearableDataPoint[]> {
  const response = await fetch(`${GARMIN_BASE_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Garmin API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const dataPoints: WearableDataPoint[] = []

  // Transform data based on endpoint type
  if (endpoint.includes('dailies')) {
    data?.forEach((daily: any) => {
      const date = daily.calendarDate

      // Heart rate
      if (daily.averageHeartRateInBeatsPerMinute) {
        dataPoints.push({
          timestamp: date,
          value: daily.averageHeartRateInBeatsPerMinute,
          unit: 'bpm',
          source: 'garmin',
          dataType: 'heart_rate'
        })
      }

      // Resting heart rate
      if (daily.restingHeartRateInBeatsPerMinute) {
        dataPoints.push({
          timestamp: date,
          value: daily.restingHeartRateInBeatsPerMinute,
          unit: 'bpm',
          source: 'garmin',
          dataType: 'resting_heart_rate'
        })
      }

      // Steps
      if (daily.steps) {
        dataPoints.push({
          timestamp: date,
          value: daily.steps,
          unit: 'steps',
          source: 'garmin',
          dataType: 'steps'
        })
      }

      // Calories
      if (daily.activeKilocalories) {
        dataPoints.push({
          timestamp: date,
          value: daily.activeKilocalories,
          unit: 'kcal',
          source: 'garmin',
          dataType: 'calories'
        })
      }
    })
  } else if (endpoint.includes('sleeps')) {
    data?.forEach((sleep: any) => {
      dataPoints.push({
        timestamp: sleep.calendarDate,
        value: sleep.durationInSeconds / (60 * 60), // Convert to hours
        unit: 'hours',
        source: 'garmin',
        dataType: 'sleep_duration'
      })
    })
  } else if (endpoint.includes('trainingStatus')) {
    data?.forEach((training: any) => {
      if (training.trainingLoad) {
        dataPoints.push({
          timestamp: training.calendarDate,
          value: training.trainingLoad,
          unit: 'score',
          source: 'garmin',
          dataType: 'training_load'
        })
      }
    })
  }

  return dataPoints
}

export async function refreshGarminToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.GARMIN_CLIENT_ID
    const clientSecret = process.env.GARMIN_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Garmin credentials not configured' }
    }

    const response = await fetch('https://connect.garmin.com/oauth-service/oauth/token', {
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
    console.error('Error refreshing Garmin token:', error)
    return { error: 'Failed to refresh token' }
  }
}
