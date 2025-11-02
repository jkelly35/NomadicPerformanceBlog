// MyFitnessPal API Integration
// Documentation: https://developer.myfitnesspal.com/

import { WearableDataPoint, WearableDataType } from '../fitness-data'

const MFP_BASE_URL = 'https://api.myfitnesspal.com/v2'

export async function connectMyFitnessPal(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
  try {
    const clientId = process.env.MFP_CLIENT_ID
    if (!clientId) {
      return { success: false, error: 'MyFitnessPal client ID not configured' }
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/myfitnesspal/callback`
    const state = crypto.randomUUID()

    const authUrl = `https://www.myfitnesspal.com/oauth2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `state=${state}&` +
      `scope=diary.read`

    return { success: true, authUrl }
  } catch (error) {
    console.error('Error connecting to MyFitnessPal:', error)
    return { success: false, error: 'Failed to initiate MyFitnessPal connection' }
  }
}

export async function syncMyFitnessPalData(userId: string, accessToken: string): Promise<{ success: boolean; dataPoints?: WearableDataPoint[]; error?: string }> {
  try {
    const dataPoints: WearableDataPoint[] = []
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get diary entries for the last week
    for (let date = new Date(weekAgo); date <= today; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0]

      try {
        const diaryResponse = await fetch(
          `${MFP_BASE_URL}/diary/${dateStr}`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )

        if (diaryResponse.ok) {
          const diary = await diaryResponse.json()

          // Calories consumed
          if (diary.totals?.calories) {
            dataPoints.push({
              timestamp: dateStr,
              value: diary.totals.calories,
              unit: 'kcal',
              source: 'myfitnesspal',
              dataType: 'calories'
            })
          }

          // Macronutrients
          if (diary.totals?.carbohydrates) {
            dataPoints.push({
              timestamp: dateStr,
              value: diary.totals.carbohydrates,
              unit: 'g',
              source: 'myfitnesspal',
              dataType: 'active_energy' // Using active_energy for carbs
            })
          }

          if (diary.totals?.protein) {
            dataPoints.push({
              timestamp: dateStr,
              value: diary.totals.protein,
              unit: 'g',
              source: 'myfitnesspal',
              dataType: 'active_energy' // Using active_energy for protein
            })
          }

          if (diary.totals?.fat) {
            dataPoints.push({
              timestamp: dateStr,
              value: diary.totals.fat,
              unit: 'g',
              source: 'myfitnesspal',
              dataType: 'active_energy' // Using active_energy for fat
            })
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch MyFitnessPal data for ${dateStr}:`, error)
      }
    }

    return { success: true, dataPoints }
  } catch (error) {
    console.error('Error syncing MyFitnessPal data:', error)
    return { success: false, error: 'Failed to sync MyFitnessPal data' }
  }
}

export async function refreshMyFitnessPalToken(refreshToken: string): Promise<{ accessToken?: string; expiresIn?: number; error?: string }> {
  try {
    const clientId = process.env.MFP_CLIENT_ID
    const clientSecret = process.env.MFP_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return { error: 'MyFitnessPal credentials not configured' }
    }

    const response = await fetch('https://api.myfitnesspal.com/oauth2/token', {
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
    console.error('Error refreshing MyFitnessPal token:', error)
    return { error: 'Failed to refresh token' }
  }
}
