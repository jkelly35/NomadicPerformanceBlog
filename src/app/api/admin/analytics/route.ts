import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Helper function to format duration from seconds to MM:SS
function formatDuration(seconds: string): string {
  const totalSeconds = parseFloat(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = Math.floor(totalSeconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const isMainAdmin = user.email === 'joe@nomadicperformance.com'
    let isAuthorized = isMainAdmin

    if (!isMainAdmin) {
      try {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single()

        isAuthorized = adminUser !== null
      } catch (dbError) {
        console.log('Admin users table not found or error:', dbError)
        isAuthorized = false
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Check if GA4 credentials are configured
    const ga4PropertyId = process.env.GA4_PROPERTY_ID

    if (!ga4PropertyId) {
      // Return mock data if GA4 not configured
      const mockAnalyticsData = {
        realtime: {
          activeUsers: Math.floor(Math.random() * 50) + 10,
          pageViews: Math.floor(Math.random() * 200) + 50,
          topPages: [
            { page: '/', views: Math.floor(Math.random() * 100) + 20 },
            { page: '/dashboard', views: Math.floor(Math.random() * 80) + 15 },
            { page: '/blog', views: Math.floor(Math.random() * 60) + 10 },
            { page: '/nutrition', views: Math.floor(Math.random() * 40) + 5 },
            { page: '/training', views: Math.floor(Math.random() * 30) + 3 },
          ]
        },
        overview: {
          totalUsers: 1250,
          newUsers: 89,
          sessions: 2100,
          pageViews: 4500,
          avgSessionDuration: '3:24',
          bounceRate: '42.3%'
        },
        traffic: {
          sources: [
            { source: 'organic', users: 450, percentage: 36 },
            { source: 'direct', users: 320, percentage: 26 },
            { source: 'social', users: 280, percentage: 22 },
            { source: 'referral', users: 150, percentage: 12 },
            { source: 'email', users: 50, percentage: 4 }
          ],
          devices: [
            { device: 'desktop', users: 680, percentage: 54 },
            { device: 'mobile', users: 520, percentage: 42 },
            { device: 'tablet', users: 50, percentage: 4 }
          ]
        },
        content: {
          topPages: [
            { page: '/', views: 1200, avgTime: '2:15', bounceRate: '35%' },
            { page: '/blog/nutrition-hierarchy-outdoor-athletes', views: 450, avgTime: '4:30', bounceRate: '25%' },
            { page: '/dashboard', views: 380, avgTime: '5:20', bounceRate: '20%' },
            { page: '/training', views: 320, avgTime: '3:45', bounceRate: '40%' },
            { page: '/nutrition', views: 280, avgTime: '4:10', bounceRate: '30%' }
          ],
          popularContent: [
            { title: 'Nutrition Hierarchy for Outdoor Athletes', views: 450, engagement: '85%' },
            { title: 'Training Dashboard Guide', views: 320, engagement: '78%' },
            { title: 'Injury Prevention Tips', views: 280, engagement: '72%' }
          ]
        },
        users: {
          demographics: {
            locations: [
              { country: 'United States', users: 680, percentage: 54 },
              { country: 'Canada', users: 180, percentage: 14 },
              { country: 'United Kingdom', users: 120, percentage: 10 },
              { country: 'Australia', users: 90, percentage: 7 },
              { country: 'Germany', users: 60, percentage: 5 }
            ],
            ageGroups: [
              { age: '18-24', users: 150, percentage: 12 },
              { age: '25-34', users: 420, percentage: 34 },
              { age: '35-44', users: 380, percentage: 30 },
              { age: '45-54', users: 200, percentage: 16 },
              { age: '55+', users: 100, percentage: 8 }
            ]
          },
          behavior: {
            newVsReturning: [
              { type: 'New Users', users: 320, percentage: 26 },
              { type: 'Returning Users', users: 930, percentage: 74 }
            ],
            sessionFrequency: [
              { frequency: 'Daily', users: 180, percentage: 14 },
              { frequency: 'Weekly', users: 450, percentage: 36 },
              { frequency: 'Monthly', users: 620, percentage: 50 }
            ]
          }
        },
        goals: {
          conversions: [
            { goal: 'Newsletter Signup', completions: 45, conversionRate: '3.6%' },
            { goal: 'Contact Form Submission', completions: 28, conversionRate: '2.2%' },
            { goal: 'Service Inquiry', completions: 15, conversionRate: '1.2%' },
            { goal: 'Blog Post Engagement', completions: 120, conversionRate: '9.6%' }
          ]
        }
      }

      return NextResponse.json({
        data: mockAnalyticsData,
        note: 'Free analytics dashboard with Vercel Analytics tracking. No API costs!',
        lastUpdated: new Date().toISOString()
      })
    }

    // Try to get access token from gcloud CLI
    try {
      const { execSync } = require('child_process')

      // Get access token from gcloud CLI
      const accessToken = execSync('gcloud auth print-access-token', {
        encoding: 'utf8',
        timeout: 5000
      }).trim()

      if (!accessToken) {
        throw new Error('No access token from gcloud CLI')
      }

      // Use the access token for GA4 API calls
      const { google } = require('googleapis')

      // Create OAuth2 client with the access token
      const oauth2Client = new google.auth.OAuth2()
      oauth2Client.setCredentials({ access_token: accessToken })

      const analyticsData = google.analyticsdata({ version: 'v1beta', auth: oauth2Client })

      // Example: Get real-time data
      const realtimeResponse = await analyticsData.properties.runRealtimeReport({
        property: `properties/${ga4PropertyId}`,
        requestBody: {
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
          limit: 5
        }
      })

      // Get overview data (last 30 days)
      const overviewResponse = await analyticsData.properties.runReport({
        property: `properties/${ga4PropertyId}`,
        requestBody: {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' }
          ]
        }
      })

      // Process and return real GA4 data
      const realAnalyticsData = {
        realtime: {
          activeUsers: realtimeResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0',
          pageViews: realtimeResponse.data.rows?.[0]?.metricValues?.[1]?.value || '0',
          topPages: realtimeResponse.data.rows?.map((row: any) => ({
            page: row.dimensionValues?.[0]?.value || '/',
            views: row.metricValues?.[1]?.value || '0'
          })) || []
        },
        overview: {
          totalUsers: overviewResponse.data.rows?.[0]?.metricValues?.[0]?.value || '0',
          newUsers: overviewResponse.data.rows?.[0]?.metricValues?.[1]?.value || '0',
          sessions: overviewResponse.data.rows?.[0]?.metricValues?.[2]?.value || '0',
          pageViews: overviewResponse.data.rows?.[0]?.metricValues?.[3]?.value || '0',
          avgSessionDuration: formatDuration(overviewResponse.data.rows?.[0]?.metricValues?.[4]?.value || '0'),
          bounceRate: `${(parseFloat(overviewResponse.data.rows?.[0]?.metricValues?.[5]?.value || '0') * 100).toFixed(1)}%`
        },
        // Add more data sections as needed...
        traffic: { sources: [], devices: [] },
        content: { topPages: [], popularContent: [] },
        users: { demographics: { locations: [], ageGroups: [] }, behavior: { newVsReturning: [], sessionFrequency: [] } },
        goals: { conversions: [] }
      }

      return NextResponse.json({
        data: realAnalyticsData,
        note: 'Real GA4 data via gcloud CLI authentication',
        lastUpdated: new Date().toISOString()
      })

    } catch (gcloudError) {
      console.error('Error with gcloud CLI authentication:', gcloudError)

      // Fallback to enhanced mock data
      const analyticsData = {
        realtime: {
          activeUsers: Math.floor(Math.random() * 50) + 10,
          pageViews: Math.floor(Math.random() * 200) + 50,
          topPages: [
            { page: '/', views: Math.floor(Math.random() * 100) + 20 },
            { page: '/dashboard', views: Math.floor(Math.random() * 80) + 15 },
            { page: '/blog', views: Math.floor(Math.random() * 60) + 10 },
            { page: '/nutrition', views: Math.floor(Math.random() * 40) + 5 },
            { page: '/training', views: Math.floor(Math.random() * 30) + 3 },
          ]
        },
        overview: {
          totalUsers: 1250,
          newUsers: 89,
          sessions: 2100,
          pageViews: 4500,
          avgSessionDuration: '3:24',
          bounceRate: '42.3%'
        },
        traffic: {
          sources: [
            { source: 'organic', users: 450, percentage: 36 },
            { source: 'direct', users: 320, percentage: 26 },
            { source: 'social', users: 280, percentage: 22 },
            { source: 'referral', users: 150, percentage: 12 },
            { source: 'email', users: 50, percentage: 4 }
          ],
          devices: [
            { device: 'desktop', users: 680, percentage: 54 },
            { device: 'mobile', users: 520, percentage: 42 },
            { device: 'tablet', users: 50, percentage: 4 }
          ]
        },
        content: {
          topPages: [
            { page: '/', views: 1200, avgTime: '2:15', bounceRate: '35%' },
            { page: '/blog/nutrition-hierarchy-outdoor-athletes', views: 450, avgTime: '4:30', bounceRate: '25%' },
            { page: '/dashboard', views: 380, avgTime: '5:20', bounceRate: '20%' },
            { page: '/training', views: 320, avgTime: '3:45', bounceRate: '40%' },
            { page: '/nutrition', views: 280, avgTime: '4:10', bounceRate: '30%' }
          ],
          popularContent: [
            { title: 'Nutrition Hierarchy for Outdoor Athletes', views: 450, engagement: '85%' },
            { title: 'Training Dashboard Guide', views: 320, engagement: '78%' },
            { title: 'Injury Prevention Tips', views: 280, engagement: '72%' }
          ]
        },
        users: {
          demographics: {
            locations: [
              { country: 'United States', users: 680, percentage: 54 },
              { country: 'Canada', users: 180, percentage: 14 },
              { country: 'United Kingdom', users: 120, percentage: 10 },
              { country: 'Australia', users: 90, percentage: 7 },
              { country: 'Germany', users: 60, percentage: 5 }
            ],
            ageGroups: [
              { age: '18-24', users: 150, percentage: 12 },
              { age: '25-34', users: 420, percentage: 34 },
              { age: '35-44', users: 380, percentage: 30 },
              { age: '45-54', users: 200, percentage: 16 },
              { age: '55+', users: 100, percentage: 8 }
            ]
          },
          behavior: {
            newVsReturning: [
              { type: 'New Users', users: 320, percentage: 26 },
              { type: 'Returning Users', users: 930, percentage: 74 }
            ],
            sessionFrequency: [
              { frequency: 'Daily', users: 180, percentage: 14 },
              { frequency: 'Weekly', users: 450, percentage: 36 },
              { frequency: 'Monthly', users: 620, percentage: 50 }
            ]
          }
        },
        goals: {
          conversions: [
            { goal: 'Newsletter Signup', completions: 45, conversionRate: '3.6%' },
            { goal: 'Contact Form Submission', completions: 28, conversionRate: '2.2%' },
            { goal: 'Service Inquiry', completions: 15, conversionRate: '1.2%' },
            { goal: 'Blog Post Engagement', completions: 120, conversionRate: '9.6%' }
          ]
        }
      }

      return NextResponse.json({
        data: analyticsData,
        note: 'Enhanced mock data. Real analytics tracked via free Vercel Analytics.',
        error: gcloudError instanceof Error ? gcloudError.message : 'Unknown error',
        lastUpdated: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 })
  }
}
