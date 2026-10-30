import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import RouteChangeOverlay from "@/components/RouteChangeOverlay";
import { RouteLoadingProvider } from "@/contexts/RouteLoadingContext";
import { branding } from "@/lib/config/branding";

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
      <body className="antialiased">
        <Toaster position="top-right" richColors   />
        <RouteLoadingProvider>
          {children}
          <RouteChangeOverlay />
        </RouteLoadingProvider>
      </body>
    </html>
  );
}
