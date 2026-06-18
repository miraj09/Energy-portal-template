import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import RouteChangeOverlay from "@/components/RouteChangeOverlay";
import { RouteLoadingProvider } from "@/contexts/RouteLoadingContext";
import { branding } from "@/lib/config/branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: branding.appName,
  description: branding.appDescription,
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
      >
        <Toaster position="top-right" richColors   />
        <RouteLoadingProvider>
          {children}
          <RouteChangeOverlay />
        </RouteLoadingProvider>
      </body>
    </html>
  );
}
