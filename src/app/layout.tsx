import React from 'react';
import type { Metadata } from "next";
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';

export const metadata: Metadata = {
  title: "Nomadic Performance - Outdoor Fitness & Adventure Blog",
  description: "Helping outdoor athletes and adventurers stay strong, prevent injuries, and perform at their best—anywhere, anytime.",
  keywords: "outdoor fitness, Utah adventures, physical therapy, nomadic performance, hiking, skiing",
  authors: [{ name: "Nomadic Performance" }],
  openGraph: {
    title: "Nomadic Performance",
    description: "Helping outdoor athletes and adventurers stay strong, prevent injuries, and perform at their best—anywhere, anytime.",
    type: "website",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/images/NPLogo.png',
  },
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
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
