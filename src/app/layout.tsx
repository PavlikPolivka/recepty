import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recipe Simplifier - Clean Recipe Extraction & Organization",
  description: "Extract clean, organized recipes from any URL. Save your favorite recipes and access them anywhere. Supports multiple languages and beautiful print layouts.",
  keywords: ["recipe", "cooking", "meal planning", "recipe organizer", "recipe extractor", "cookbook", "food"],
  authors: [{ name: "Recipe Simplifier" }],
  creator: "Recipe Simplifier",
  publisher: "Recipe Simplifier",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Recipe Simplifier - Clean Recipe Extraction & Organization",
    description: "Extract clean, organized recipes from any URL. Save your favorite recipes and access them anywhere.",
    url: "/",
    siteName: "Recipe Simplifier",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recipe Simplifier - Clean Recipe Extraction & Organization",
    description: "Extract clean, organized recipes from any URL. Save your favorite recipes and access them anywhere.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}