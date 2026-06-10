import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      // Frame-blocking stays production-only: local preview panes embed the dev server in an iframe.
      ...(isProd ? ["frame-ancestors 'none'"] : []),
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.k12gig.com https://challenges.cloudflare.com https://*.stripe.com",
      "style-src 'self' 'unsafe-inline' https://clerk.k12gig.com",
      "img-src 'self' data: blob: https://randomuser.me https://img.clerk.com https://images.clerk.dev https://clerk.k12gig.com https://*.stripe.com",
      "font-src 'self' data: https://clerk.k12gig.com",
      "connect-src 'self' https://*.convex.cloud https://*.convex.site wss://*.convex.cloud https://*.clerk.accounts.dev https://*.clerk.com https://clerk.k12gig.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://api.stripe.com https://*.stripe.com https://*.sentry.io",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.k12gig.com https://challenges.cloudflare.com https://*.stripe.com",
      "worker-src 'self' blob:",
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(isProd ? [{ key: "X-Frame-Options", value: "DENY" }] : []),
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: "/api/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
