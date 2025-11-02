// Google Fit API Integration
// Documentation: https://developers.google.com/fit

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.blood_pressure.read',
  'https://www.googleapis.com/auth/fitness.body_temperature.read',
  'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
  'https://www.googleapis.com/auth/fitness.reproductive_health.read'
]

const GOOGLE_FIT_BASE_URL = 'https://www.googleapis.com/fitness/v1/users/me'

// Data source IDs for different data types
const GOOGLE_FIT_DATA_SOURCES = {
  heart_rate: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
  steps: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
  calories: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
  weight: 'derived:com.google.weight:com.google.android.gms:merge_weight',
  body_fat: 'derived:com.google.body.fat.percentage:com.google.android.gms:merge_body_fat_percentage',
  sleep: 'derived:com.google.sleep.segment:com.google.android.gms:merge_sleep_segments',
  blood_pressure: 'derived:com.google.blood_pressure:com.google.android.gms:merge_blood_pressure',
  body_temperature: 'derived:com.google.body.temperature:com.google.android.gms:merge_body_temperature',
  oxygen_saturation: 'derived:com.google.oxygen_saturation:com.google.android.gms:merge_oxygen_saturation'
}

export async function connectGoogleFit(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.GOOGLE_FIT_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Google Fit client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/google-fit/callback`
    const scope = GOOGLE_FIT_SCOPES.join(' ')
    const state = crypto.randomUUID()

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Google Fit:', error)
    return { success: false, error: 'Failed to initiate Google Fit connection' }
  }
}

export async function syncGoogleFitData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch different data types
    const dataTypes = [
      { type: 'heart_rate' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.heart_rate },
      { type: 'steps' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.steps },
      { type: 'calories' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.calories },
      { type: 'weight' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.weight },
      { type: 'body_fat' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.body_fat },
      { type: 'sleep_duration' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.sleep },
      { type: 'blood_pressure_systolic' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.blood_pressure },
      { type: 'body_temperature' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.body_temperature },
      { type: 'blood_oxygen' as WearableDataType, sourceId: GOOGLE_FIT_DATA_SOURCES.oxygen_saturation }
    ]

    for (const { type, sourceId } of dataTypes) {
      try {
        const points = await fetchGoogleFitData(accessToken, sourceId, oneWeekAgo, now)
        dataPoints.push(...points.map(point => ({
          ...point,
          dataType: type,
          source: 'google-fit'
        })))
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Google Fit:`, error)
        // Continue with other data types
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Google Fit data:', error)
    return { success: false, error: 'Failed to sync Google Fit data' }
  }
}

async function fetchGoogleFitData(accessToken: string, dataSourceId: string, startTime: Date, endTime: Date): Promise<Omit<WearableDataPoint, 'dataType' | 'source'>[]> {
  const startTimeMillis = startTime.getTime()
  const endTimeMillis = endTime.getTime()

  const response = await fetch(
    `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${startTimeMillis * 1000000}-${endTimeMillis * 1000000}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Google Fit API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  return data.point?.map((point: any) => ({
    timestamp: new Date(point.startTimeNanos / 1000000).toISOString(),
    value: point.value[0]?.fpVal || point.value[0]?.intVal || 0,
    unit: getUnitForDataSource(dataSourceId)
  })) || []
}

function getUnitForDataSource(dataSourceId: string): string | undefined {
  if (dataSourceId.includes('heart_rate')) return 'bpm'
  if (dataSourceId.includes('step_count')) return 'steps'
  if (dataSourceId.includes('calories')) return 'kcal'
  if (dataSourceId.includes('weight')) return 'kg'
  if (dataSourceId.includes('body.fat')) return '%'
  if (dataSourceId.includes('blood_pressure')) return 'mmHg'
  if (dataSourceId.includes('temperature')) return '°C'
  if (dataSourceId.includes('oxygen_saturation')) return '%'
  return undefined
}

export async function refreshGoogleFitToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.GOOGLE_FIT_CLIENT_ID
    const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Google Fit credentials not configured' }
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
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
    console.error('Error refreshing Google Fit token:', error)
    return { error: 'Failed to refresh token' }
  }
}
