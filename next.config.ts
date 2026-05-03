import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://*.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://randomuser.me https://img.clerk.com https://images.clerk.dev https://*.stripe.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.convex.cloud https://*.convex.site wss://*.convex.cloud https://*.clerk.accounts.dev https://*.clerk.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://api.stripe.com https://*.stripe.com https://*.sentry.io",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://*.stripe.com",
      "worker-src 'self' blob:",
      ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
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
