import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const SITE_DESCRIPTION =
  "Fiverr for school districts. Connect with credential-verified K-12 educators, coaches, and specialists — no staffing-agency markup.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "K12Gig - The K-12 Educator Marketplace",
    template: "%s | K12Gig",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "K12Gig - The K-12 Educator Marketplace",
    description: SITE_DESCRIPTION,
    url: APP_URL,
    siteName: "K12Gig",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "K12Gig - The K-12 Educator Marketplace",
    description: SITE_DESCRIPTION,
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
      >
        <TooltipProvider>
          <Providers>
            {children}
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
