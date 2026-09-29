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
  "Connect school districts with credential-reviewed K-12 consultants. Post a gig, review proposals, and coordinate contracts. Payment stays off-platform.";

export const metadata: Metadata = {
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
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            forcedTheme="light"
            disableTransitionOnChange
          >
            <Providers>
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[var(--accent-primary)] focus:shadow-lg focus:outline-2 focus:outline-[var(--accent-primary)]"
              >
                Skip to main content
              </a>
              {children}
              <CookieConsent />
            </Providers>
          </ThemeProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
