// Strava API Integration
// Documentation: https://developers.strava.com/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const STRAVA_BASE_URL = 'https://www.strava.com/api/v3'

export async function connectStrava(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'Strava client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/strava/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://www.strava.com/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=read,read_all,activity:read`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to Strava:', error)
    return { success: false, error: 'Failed to initiate Strava connection' }
  }
}

export async function syncStravaData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []

    // Get recent activities (last 7 days)
    const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)

    const activitiesResponse = await fetch(
      `${STRAVA_BASE_URL}/athlete/activities?after=${sevenDaysAgo}&per_page=30`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    )

    if (!activitiesResponse.ok) {
      throw new Error('Failed to fetch Strava activities')
    }

    const activities = await activitiesResponse.json()

    activities.forEach((activity: any) => {
      const timestamp = activity.start_date

      // Distance (convert meters to km)
      if (activity.distance) {
        dataPoints.push({
          timestamp,
          value: activity.distance / 1000,
          unit: 'km',
          source: 'strava',
          dataType: 'exercise_time' // Using exercise_time for distance
        })
      }

      // Moving time (convert seconds to minutes)
      if (activity.moving_time) {
        dataPoints.push({
          timestamp,
          value: activity.moving_time / 60,
          unit: 'minutes',
          source: 'strava',
          dataType: 'exercise_time'
        })
      }

      // Calories
      if (activity.calories) {
        dataPoints.push({
          timestamp,
          value: activity.calories,
          unit: 'kcal',
          source: 'strava',
          dataType: 'calories'
        })
      }

      // Average heart rate
      if (activity.average_heartrate) {
        dataPoints.push({
          timestamp,
          value: activity.average_heartrate,
          unit: 'bpm',
          source: 'strava',
          dataType: 'heart_rate'
        })
      }

      // Max heart rate
      if (activity.max_heartrate) {
        dataPoints.push({
          timestamp,
          value: activity.max_heartrate,
          unit: 'bpm',
          source: 'strava',
          dataType: 'heart_rate'
        })
      }
    })

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing Strava data:', error)
    return { success: false, error: 'Failed to sync Strava data' }
  }
}

export async function refreshStravaToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID
    const clientSecret = process.env.STRAVA_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'Strava credentials not configured' }
    }

    const response = await fetch('https://www.strava.com/oauth/token', {
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
    console.error('Error refreshing Strava token:', error)
    return { error: 'Failed to refresh token' }
  }
}
