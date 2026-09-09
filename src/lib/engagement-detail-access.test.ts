// @vitest-environment node
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";

describe("engagement detail page access contract", () => {
    it("returns the same unavailable result for foreign district, foreign consultant, and missing records", async () => {
        const { t, as, rows } = await seeded();
        const engagementId = rows.engagements[0]._id;
        const missingId = await t.run(async (ctx) => {
            const source = await ctx.db.get(engagementId);
            if (!source) throw new Error("fixture engagement unavailable");
            const { _id, _creationTime, ...fields } = source;
            void _id; void _creationTime;
            const id = await ctx.db.insert("engagements", fields);
            await ctx.db.delete(id);
            return id;
        });

        await expect(as("district-b").query(api.engagements.getDetailPage, { engagementId })).resolves.toEqual({ status: "unavailable" });
        await expect(as("consultant-b").query(api.engagements.getDetailPage, { engagementId })).resolves.toEqual({ status: "unavailable" });
        await expect(as("district-a").query(api.engagements.getDetailPage, { engagementId: missingId })).resolves.toEqual({ status: "unavailable" });
    });

    it("returns details to the consultant counterpart and a district teammate", async () => {
        const { as, rows } = await seeded();
        const engagement = rows.engagements[0];
        const consultantAlias = engagement.educatorUserId === rows.users.find((user) => user.firstName === "consultant-a")?._id
            ? "consultant-a"
            : "consultant-b";

        const consultantResult = await as(consultantAlias).query(api.engagements.getDetailPage, { engagementId: engagement._id });
        const teammateResult = await as("district-teammate").query(api.engagements.getDetailPage, { engagementId: engagement._id });

        expect(consultantResult.status).toBe("available");
        expect(teammateResult.status).toBe("available");
        if (consultantResult.status === "available") expect(consultantResult.detail.engagement._id).toBe(engagement._id);
        if (teammateResult.status === "available") expect(teammateResult.detail.engagement.partyAccess).toBe(true);
    });
});
