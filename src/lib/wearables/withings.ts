// Withings API Integration
// Documentation: https://developer.withings.com/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const WITHINGS_BASE_URL = 'https://wbsapi.withings.net'

export async function connectWithings(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.WITHINGS_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Withings client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/withings/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://account.withings.com/oauth2_user/authorize2?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=user.info,user.metrics,user.activity`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Withings:', error)
    return { success: false, error: 'Failed to initiate Withings connection' }
  }
}

export async function syncWithingsData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const now = Math.floor(Date.now() / 1000)
    const weekAgo = now - (7 * 24 * 60 * 60)

    // Fetch different data types
    const measureTypes = [
      { type: 'weight' as WearableDataType, measureType: 1 },
      { type: 'body_fat' as WearableDataType, measureType: 6 },
      { type: 'muscle_mass' as WearableDataType, measureType: 76 },
      { type: 'body_water' as WearableDataType, measureType: 5 },
      { type: 'bone_mass' as WearableDataType, measureType: 88 },
      { type: 'blood_pressure_systolic' as WearableDataType, measureType: 10 },
      { type: 'blood_pressure_diastolic' as WearableDataType, measureType: 11 }
    ]

    for (const { type, measureType } of measureTypes) {
      try {
        const points = await fetchWithingsData(accessToken, measureType, type)
        dataPoints.push(...points)
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Withings:`, error)
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Withings data:', error)
    return { success: false, error: 'Failed to sync Withings data' }
  }
}

async function fetchWithingsData(accessToken: string, measureType: number, dataType: WearableDataType): Promise<WearableDataPoint[]> {
  const response = await fetch(
    `${WITHINGS_BASE_URL}/measure?action=getmeas&meastype=${measureType}&category=1`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Withings API error: ${response.status}`)
  }

  const data = await response.json()
  const dataPoints: WearableDataPoint[] = []

  data.body?.measuregrps?.forEach((group: any) => {
    group.measures?.forEach((measure: any) => {
      if (measure.type === measureType) {
        dataPoints.push({
          timestamp: new Date(group.date * 1000).toISOString(),
          value: measure.value * Math.pow(10, measure.unit),
          unit: getWithingsUnit(measureType),
          source: 'withings',
          dataType
        })
      }
    })
  })

  return dataPoints
}

function getWithingsUnit(measureType: number): string | undefined {
  switch (measureType) {
    case 1: return 'kg' // weight
    case 6: return '%' // body fat
    case 76: return 'kg' // muscle mass
    case 5: return '%' // body water
    case 88: return 'kg' // bone mass
    case 10: return 'mmHg' // systolic BP
    case 11: return 'mmHg' // diastolic BP
    default: return undefined
  }
}

export async function refreshWithingsToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.WITHINGS_CLIENT_ID
    const clientSecret = process.env.WITHINGS_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Withings credentials not configured' }
    }

    const response = await fetch('https://wbsapi.withings.net/v2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
    return { accessToken: data.access_token, expiresIn: data.expires_in }
  } catch (error) {
    console.error('Error refreshing Withings token:', error)
    return { error: 'Failed to refresh token' }
  }
}
