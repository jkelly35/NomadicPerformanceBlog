// Google Analytics tracking utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID!, {
      page_path: url,
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track user engagement
export const trackEngagement = (action: string, details?: Record<string, any>) => {
  trackEvent(action, 'engagement', JSON.stringify(details));
};

// Track content interactions
export const trackContentInteraction = (
  contentType: string,
  contentId: string,
  action: string
) => {
  trackEvent(action, 'content', `${contentType}:${contentId}`);
};

// Track conversions
export const trackConversion = (conversionType: string, value?: number) => {
  trackEvent('conversion', 'conversion', conversionType, value);
};

// Track user journey
export const trackUserJourney = (step: string, details?: Record<string, any>) => {
  trackEvent('journey_step', 'user_journey', step, details?.stepNumber);
};
