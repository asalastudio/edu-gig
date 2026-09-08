import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/shared/cookie-consent";
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
  "Connect school districts with credential-reviewed K-12 consultants. Post a need, review proposals, and coordinate contracts. Payment stays off-platform.";

export const metadata: Metadata = {
  ...(process.env.NEXT_PUBLIC_APP_ENV === "staging" ? { robots: { index: false, follow: false } } : {}),
  metadataBase: new URL(APP_URL),
    title: {
    default: "K12Gig - The K-12 Consultant Marketplace",
    template: "%s | K12Gig",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: "K12Gig - The K-12 Consultant Marketplace",
    description: SITE_DESCRIPTION,
    url: APP_URL,
    siteName: "K12Gig",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "K12Gig - The K-12 Consultant Marketplace",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {process.env.NEXT_PUBLIC_APP_ENV === "staging" && <div role="status" className="sticky top-0 z-[100] bg-amber-200 px-4 py-2 text-center text-sm font-bold text-slate-950">STAGING · Synthetic QA data · Email captured · No real agreements</div>}
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
          >
            <Providers>
              {children}
              <CookieConsent />
            </Providers>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
