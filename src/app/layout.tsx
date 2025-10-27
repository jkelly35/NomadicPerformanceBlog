import type { Metadata } from "next";
import './globals.css';

// Fonts removed

export const metadata: Metadata = {
  title: "Nomadic Performance - Outdoor Fitness & Adventure Blog",
  description: "Expert training, guides, and resources for Utah's adventurous spirit. Elevate your outdoor experience with professional physical therapy and fitness advice.",
  keywords: "outdoor fitness, Utah adventures, physical therapy, nomadic performance, hiking, skiing",
  authors: [{ name: "Nomadic Performance" }],
  openGraph: {
    title: "Nomadic Performance",
    description: "Elevate your outdoor experience with expert training and guides for Utah adventures.",
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
        {children}
      </body>
    </html>
  );
}
