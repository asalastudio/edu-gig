import type { QueryCtx } from "../_generated/server";
import resources from "../../scripts/staging/resources.json";

export function assertStagingEnvironment() {
    if (process.env.APP_ENV !== "staging" ||
        process.env.CONVEX_CLOUD_URL !== resources.convexUrl ||
        process.env.QA_CONVEX_DEPLOYMENT !== resources.convexDeployment ||
        process.env.CLERK_JWT_ISSUER_DOMAIN !== resources.clerkIssuer ||
        process.env.QA_CLERK_INSTANCE_ID !== resources.clerkInstanceId ||
        process.env.NEXT_PUBLIC_APP_URL !== resources.appUrl ||
        process.env.QA_EMAIL_MODE !== "capture" ||
        process.env.RESEND_API_KEY || process.env.STRIPE_SECRET_KEY || process.env.CHECKR_API_KEY) {
        throw new Error("Staging resource identity mismatch; operation refused");
    }
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
