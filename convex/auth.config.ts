/**
 * Clerk JWT provider for Convex auth.
 *
 * Gracefully degrades when CLERK_JWT_ISSUER_DOMAIN is not yet set in the
 * Convex deployment — lets `npx convex deploy --prod` succeed before Clerk
 * is provisioned. Set the env var later and the provider lights up.
 *
 * Dashboard: https://dashboard.convex.dev/d/<deployment>/settings/environment-variables
 */
const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;

if (process.env.APP_ENV === "staging" && domain !== "https://regular-wolf-65.clerk.accounts.dev") throw new Error("Staging Clerk issuer mismatch");

const authConfig = {
    providers: domain ? [{ domain, applicationID: "convex" }] : [],
};

export default authConfig;
