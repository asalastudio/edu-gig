import resources from './resources.json' with { type: 'json' };
export function checkStaging(env) {
  const expected = {
    APP_ENV: 'staging', NEXT_PUBLIC_APP_ENV: 'staging',
    NEXT_PUBLIC_APP_URL: resources.appUrl,
    NEXT_PUBLIC_CONVEX_URL: resources.convexUrl,
    NEXT_PUBLIC_CONVEX_SITE_URL: resources.convexSiteUrl,
    QA_CONVEX_DEPLOYMENT: resources.convexDeployment,
    CLERK_JWT_ISSUER_DOMAIN: resources.clerkIssuer,
    QA_CLERK_INSTANCE_ID: resources.clerkInstanceId, QA_EMAIL_MODE: 'capture',
    NEXT_PUBLIC_ENABLE_CHECKR: 'false', NEXT_PUBLIC_ENABLE_CARD_CHECKOUT: 'false',
    NEXT_PUBLIC_ENABLE_LEGACY_CHECKOUT: 'false',
  };
  for (const [key, value] of Object.entries(expected)) if (env[key] !== value) throw Error(`Staging mismatch: ${key}`);
  if (!env.CLERK_SECRET_KEY?.startsWith('sk_test_') || !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')) throw Error('Development Clerk keys required');
  const issuer = 'https://' + Buffer.from(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.slice(8), 'base64').toString().replace(/\$$/, '');
  if (issuer !== resources.clerkIssuer) throw Error('Clerk key issuer mismatch');
  if (!env.CONVEX_DEPLOY_KEY?.startsWith(`dev:${resources.convexDeployment}|`)) throw Error('Exact staging deploy key required');
  if (!env.QA_ALLOWED_CLERK_IDS?.split(',').every(id => /^user_[a-zA-Z0-9]+$/.test(id))) throw Error('Explicit reviewer identities required');
  for (const key of ['RESEND_API_KEY','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','CHECKR_API_KEY','CHECKR_WEBHOOK_SECRET','SENTRY_DSN','NEXT_PUBLIC_SENTRY_DSN','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','ALLOW_DEMO_SEED','BETA_LAUNCH_SECRET','DEMO_SEED_SECRET','CONVEX_SELF_HOSTED_URL','CONVEX_SELF_HOSTED_ADMIN_KEY']) if (env[key]) throw Error(`Integration must be absent in capture-only staging: ${key}`);
  if (env.VERCEL_PROJECT_ID && env.VERCEL_PROJECT_ID !== resources.vercelProjectId) throw Error("Wrong Vercel project");
  return resources;
}
