'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface AnalyticsTrackerProps {
  eventType?: string
  eventData?: Record<string, any>
}

export default function AnalyticsTracker({ eventType, eventData }: AnalyticsTrackerProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Track page view on route change
    if (pathname) {
      trackEvent('page_view', {
        page: pathname,
        timestamp: new Date().toISOString(),
        ...eventData
      })
    }
  }, [pathname, eventData])

  useEffect(() => {
    // Track custom events
    if (eventType) {
      trackEvent(eventType, {
        timestamp: new Date().toISOString(),
        ...eventData
      })
    }
  }, [eventType, eventData])

  const trackEvent = async (type: string, data: Record<string, any>) => {
    try {
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: type,
          event_data: data,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          referrer: document.referrer
        }),
      })

      if (!response.ok) {
        console.warn('Analytics tracking failed:', response.statusText)
      }
    } catch (error) {
      console.warn('Analytics tracking error:', error)
    }
  }

  return null // This component doesn't render anything
}

// Hook for tracking custom events
export function useAnalytics() {
  const trackEvent = (eventType: string, eventData?: Record<string, any>) => {
    const tracker = document.createElement('div')
    tracker.setAttribute('data-analytics-event', eventType)
    tracker.setAttribute('data-analytics-data', JSON.stringify(eventData || {}))
    document.body.appendChild(tracker)

    // Clean up
    setTimeout(() => {
      document.body.removeChild(tracker)
    }, 100)
  }

  return { trackEvent }
}
