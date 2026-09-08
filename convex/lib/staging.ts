import { BUILD_COMMIT } from "../buildIdentity";
import type { QueryCtx } from "../_generated/server";
import stable from "../../scripts/staging/resources.json";

import automation from "../../scripts/staging/automation-resources.json";

const targets = Object.freeze([Object.freeze(stable), Object.freeze(automation)]);

export function assertStagingEnvironment() {
    const resources = targets.find(r => r.convexUrl === process.env.CONVEX_CLOUD_URL);
    if (!resources) throw new Error("Staging resource identity mismatch; operation refused");
    if (process.env.APP_ENV !== "staging" ||
        process.env.CONVEX_CLOUD_URL !== resources.convexUrl ||
        process.env.QA_CONVEX_DEPLOYMENT !== resources.convexDeployment ||
        process.env.CLERK_JWT_ISSUER_DOMAIN !== resources.clerkIssuer ||
        process.env.QA_CLERK_INSTANCE_ID !== resources.clerkInstanceId ||
        process.env.NEXT_PUBLIC_APP_URL !== resources.appUrl ||
        process.env.QA_EMAIL_MODE !== "capture" ||
        ["RESEND_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "CHECKR_API_KEY", "CHECKR_WEBHOOK_SECRET", "ALLOW_DEMO_SEED", "BETA_LAUNCH_SECRET", "DEMO_SEED_SECRET"].some(key => process.env[key])) {
        throw new Error("Staging resource identity mismatch; operation refused");
    }
    return resources;
}

export async function getAppIdentity(ctx: Pick<QueryCtx, "auth">) {
    const identity = await ctx.auth.getUserIdentity();
    if (process.env.APP_ENV === "staging") {
        assertStagingEnvironment();
        if (identity && !(process.env.QA_ALLOWED_CLERK_IDS ?? "").split(",").includes(identity.subject)) {
            throw new Error("Staging reviewer access required");
        }
    }
    return identity;
}

export function assertBuildCommit(expected?: string) {
 if (!expected || !/^[a-f0-9]{40}$/.test(expected) || BUILD_COMMIT !== expected) throw new Error("Deployed backend commit proof mismatch");
}
