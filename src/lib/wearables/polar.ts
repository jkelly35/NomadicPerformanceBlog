// Polar AccessLink API Integration
// Documentation: https://www.polar.com/en/developers/api

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const POLAR_BASE_URL = 'https://www.polaraccesslink.com/v3'

export async function connectPolar(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.POLAR_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Polar client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/polar/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://flow.polar.com/oauth2/authorization?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=accesslink.read_all`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Polar:', error)
    return { success: false, error: 'Failed to initiate Polar connection' }
  }
}

export async function syncPolarData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []

    // Get user info first
    const userResponse = await fetch(`${POLAR_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to get Polar user info')
    }

    const userData = await userResponse.json()
    const polarUserId = userData['polar-user-id']

    // Fetch different data types
    const endpoints = [
      { type: 'sleep_duration' as WearableDataType, endpoint: `/users/${polarUserId}/sleep` },
      { type: 'heart_rate' as WearableDataType, endpoint: `/users/${polarUserId}/exercise-transitions` },
      { type: 'training_load' as WearableDataType, endpoint: `/users/${polarUserId}/nightly-recharge` }
    ]

    for (const { type, endpoint } of endpoints) {
      try {
        const points = await fetchPolarData(accessToken, endpoint, type)
        dataPoints.push(...points)
      } catch (error) {
        console.warn(`Failed to fetch ${type} data from Polar:`, error)
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Polar data:', error)
    return { success: false, error: 'Failed to sync Polar data' }
  }
}

async function fetchPolarData(accessToken: string, endpoint: string, dataType: WearableDataType): Promise<WearableDataPoint[]> {
  const response = await fetch(`${POLAR_BASE_URL}${endpoint}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    throw new Error(`Polar API error: ${response.status}`)
  }

  const data = await response.json()
  const dataPoints: WearableDataPoint[] = []

  if (endpoint.includes('sleep')) {
    data?.forEach((sleep: any) => {
      dataPoints.push({
        timestamp: sleep.date,
        value: sleep.duration / (60 * 60), // Convert to hours
        unit: 'hours',
        source: 'polar',
        dataType: 'sleep_duration'
      })
    })
  } else if (endpoint.includes('nightly-recharge')) {
    data?.forEach((recharge: any) => {
      dataPoints.push({
        timestamp: recharge.date,
        value: recharge.score,
        unit: 'score',
        source: 'polar',
        dataType: 'recovery_score'
      })
    })
  }

  return dataPoints
}

export async function refreshPolarToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.POLAR_CLIENT_ID
    const clientSecret = process.env.POLAR_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Polar credentials not configured' }
    }

    const response = await fetch('https://polarremote.com/v2/oauth2/token', {
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
    console.error('Error refreshing Polar token:', error)
    return { error: 'Failed to refresh token' }
  }
}
