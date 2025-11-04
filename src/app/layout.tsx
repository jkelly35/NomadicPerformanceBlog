import React from 'react';
import type { Metadata, Viewport } from "next";
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import StructuredData, { organizationStructuredData } from '@/components/StructuredData';
import ErrorBoundary from '@/components/ErrorBoundary';
import SkipLink from '@/components/SkipLink';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Nomadic Performance - Physical Therapy & Outdoor Performance Training",
  description: "Professional physical therapy and performance optimization services for outdoor athletes and adventurers in Utah. Virtual and in-person consultations available.",
  keywords: ["physical therapy", "performance training", "outdoor athletes", "injury prevention", "Utah", "fitness", "sports medicine"],
  authors: [{ name: "Nomadic Performance" }],
  creator: "Nomadic Performance",
  publisher: "Nomadic Performance",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://nomadicperformance.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Nomadic Performance - Physical Therapy & Outdoor Performance Training",
    description: "Professional physical therapy and performance optimization services for outdoor athletes and adventurers in Utah.",
    url: "https://nomadicperformance.com",
    siteName: "Nomadic Performance",
    images: [
      {
        url: "/NPLogo.png",
        width: 1200,
        height: 630,
        alt: "Nomadic Performance Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nomadic Performance - Physical Therapy & Outdoor Performance Training",
    description: "Professional physical therapy and performance optimization services for outdoor athletes and adventurers in Utah.",
    images: ["/NPLogo.png"],
    creator: "@nomadicperformance",
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a3a2a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://supabase.co" />
        <link rel="preconnect" href="https://api.supabase.co" />
        <link rel="dns-prefetch" href="//supabase.co" />
        <link rel="dns-prefetch" href="//api.supabase.co" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <StructuredData data={organizationStructuredData} />
      </head>
      <body>
        <SkipLink />
        <ErrorBoundary>
          <AuthProvider>
            <PreferencesProvider>
              {children}
              <PWAInstallPrompt />
              <OfflineIndicator />
              <AnalyticsTracker />
            </PreferencesProvider>
          </AuthProvider>
        </ErrorBoundary>
        <GoogleAnalytics />
        <Analytics />
      </body>
    </html>
  );
}
