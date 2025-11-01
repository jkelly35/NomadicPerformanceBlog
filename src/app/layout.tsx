import React from 'react';
import type { Metadata, Viewport } from "next";
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';

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
      <body>
        <AuthProvider>
          {children}
          <PWAInstallPrompt />
          <OfflineIndicator />
        </AuthProvider>
      </body>
    </html>
  );
}
