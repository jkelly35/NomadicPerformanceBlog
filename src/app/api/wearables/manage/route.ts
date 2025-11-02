import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { syncWearableData, disconnectWearableDevice } from '@/lib/fitness-data'

export async function POST(request: NextRequest) {
  try {
    const { action, provider } = await request.json()

    if (!action || !provider) {
      return NextResponse.json(
        { error: 'Missing action or provider' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createClient()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    switch (action) {
      case 'sync':
        const syncResult = await syncWearableData(provider, userId)

        if (syncResult.success && syncResult.dataPoints) {
          // Store the data points in database
          const dataPointsToInsert = syncResult.dataPoints.map(point => ({
            user_id: userId,
            integration_id: null, // We'll need to get this from the integration
            timestamp: point.timestamp,
            value: point.value,
            unit: point.unit,
            source: point.source,
            data_type: point.dataType
          }))

          // Get the integration ID
          const { data: integration } = await supabase
            .from('wearable_integrations')
            .select('id')
            .eq('user_id', userId)
            .eq('provider', provider)
            .single()

          if (integration) {
            dataPointsToInsert.forEach(point => {
              point.integration_id = integration.id
            })

            const { error: insertError } = await supabase
              .from('wearable_data_points')
              .upsert(dataPointsToInsert, {
                onConflict: 'user_id,source,data_type,timestamp'
              })

            if (insertError) {
              console.error('Error storing wearable data points:', insertError)
            }

            // Update last sync time
            await supabase
              .from('wearable_integrations')
              .update({ last_sync: new Date().toISOString() })
              .eq('user_id', userId)
              .eq('provider', provider)
          }
        }

        return NextResponse.json(syncResult)

      case 'disconnect':
        const disconnectResult = await disconnectWearableDevice(provider, userId)
        return NextResponse.json(disconnectResult)

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Wearable management error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
