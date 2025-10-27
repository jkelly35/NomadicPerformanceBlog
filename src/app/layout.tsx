import type { Metadata } from "next";
import Script from "next/script";
import './globals.css';

// Fonts removed

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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LKV47FWN2N"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LKV47FWN2N');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
