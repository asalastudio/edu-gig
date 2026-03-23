/**
 * Next.js instrumentation hook — initializes Sentry on the server when DSN is configured.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.NEXT_RUNTIME !== "nodejs") {
        return;
    }
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 0.05,
        environment: process.env.NODE_ENV,
    });
}
