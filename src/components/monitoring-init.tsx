"use client";

import { useEffect } from "react";

/**
 * Optional Sentry initialization (client). Set NEXT_PUBLIC_SENTRY_DSN in production.
 * Server-side errors can be wired separately via Sentry docs / OpenTelemetry if needed.
 */
export function MonitoringInit() {
    useEffect(() => {
        const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
        if (!dsn) return;
        let cancelled = false;
        void import("@sentry/nextjs").then((Sentry) => {
            if (cancelled) return;
            Sentry.init({
                dsn,
                tracesSampleRate: 0.05,
                environment: process.env.NODE_ENV,
            });
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return null;
}
