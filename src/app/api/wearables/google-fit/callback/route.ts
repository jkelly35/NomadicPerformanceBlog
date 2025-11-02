import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { refreshGoogleFitToken } from '@/lib/wearables/google-fit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=No authorization code received`
      )
    }

    // Exchange authorization code for access token
    const clientId = process.env.GOOGLE_FIT_CLIENT_ID
    const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/wearables/google-fit/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=Google Fit credentials not configured`
      )
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=Failed to exchange authorization code`
      )
    }

    const tokenData = await tokenResponse.json()

    // Get current user
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=User not authenticated`
      )
    }

    // Store the integration in database
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    const { error: insertError } = await supabase
      .from('wearable_integrations')
      .upsert({
        user_id: session.user.id,
        provider: 'google-fit',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: ['https://www.googleapis.com/auth/fitness.activity.read',
                 'https://www.googleapis.com/auth/fitness.body.read',
                 'https://www.googleapis.com/auth/fitness.heart_rate.read',
                 'https://www.googleapis.com/auth/fitness.sleep.read',
                 'https://www.googleapis.com/auth/fitness.blood_pressure.read',
                 'https://www.googleapis.com/auth/fitness.body_temperature.read',
                 'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
                 'https://www.googleapis.com/auth/fitness.reproductive_health.read'],
        connected: true,
        last_sync: null
      })

    if (insertError) {
      console.error('Error storing Google Fit integration:', insertError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=Failed to store integration`
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=Google Fit connected successfully`
    )

  } catch (error) {
    console.error('Google Fit OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?error=Internal server error`
    )
  }
}
