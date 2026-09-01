import { describe, expect, it } from "vitest";
import type { Id } from "@/convex/_generated/dataModel";
import { engagementInsertFields, titleFromNeed } from "../../convex/lib/createEngagement";
import { userCanAccessEngagement } from "../../convex/lib/auth";
import { startOfMonth } from "../../convex/lib/time";

const educatorUserId = "educator_user" as Id<"users">;
const buyerUserId = "buyer_user" as Id<"users">;
const districtAdminId = "district_admin" as Id<"users">;
const strangerId = "stranger" as Id<"users">;
const proposalId = "proposal_1" as Id<"proposals">;
const needId = "need_1" as Id<"needs">;
const educatorId = "educator_1" as Id<"educators">;
const districtId = "district_1" as Id<"districts">;

const proposal = {
    _id: proposalId,
    educatorId,
    educatorUserId,
    proposedRate: 125,
    proposedRateUnit: "hourly" as const,
};

const need = {
    _id: needId,
    districtId,
    orgName: "Austin ISD",
    areaOfNeed: "instruction_curriculum",
    engagementType: "consulting",
    startDate: "2026-09-01",
    duration: "6 weeks",
    compensationRange: "$120–$140/hr",
};

describe("titleFromNeed", () => {
    it("title-cases taxonomy codes for engagement titles", () => {
        expect(titleFromNeed({ areaOfNeed: "instruction_curriculum" })).toBe("Instruction Curriculum");
    });
});

describe("engagementInsertFields", () => {
    it("builds a stable engagement payload from an accepted proposal", () => {
        const fields = engagementInsertFields({
            proposal,
            need,
            buyerUserId,
            now: 1_700_000_000_000,
        });

        expect(fields.status).toBe("active");
        expect(fields.proposalId).toBe(proposalId);
        expect(fields.needId).toBe(needId);
        expect(fields.agreedRate).toBe(125);
        expect(fields.agreedRateUnit).toBe("hourly");
        expect(fields.title).toBe("Instruction Curriculum");
        expect(fields.orgName).toBe("Austin ISD");
    });

    it("is idempotent: the same acceptance inputs produce the same document fields", () => {
        const first = engagementInsertFields({ proposal, need, buyerUserId, now: 42 });
        const second = engagementInsertFields({ proposal, need, buyerUserId, now: 42 });
        expect(second).toEqual(first);
    });
});

describe("userCanAccessEngagement", () => {
    const engagement = {
        educatorUserId,
        buyerUserId,
        districtId,
    };

    it("allows the consultant, buyer, district admin, and superadmin", () => {
        expect(userCanAccessEngagement({ _id: educatorUserId, role: "educator" }, engagement, [districtAdminId])).toBe(true);
        expect(userCanAccessEngagement({ _id: buyerUserId, role: "district_admin" }, engagement, [districtAdminId])).toBe(true);
        expect(userCanAccessEngagement({ _id: districtAdminId, role: "district_hr" }, engagement, [districtAdminId])).toBe(true);
        expect(userCanAccessEngagement({ _id: strangerId, role: "superadmin" }, engagement, [districtAdminId])).toBe(true);
    });

    it("denies unrelated users, including other consultants", () => {
        expect(userCanAccessEngagement({ _id: strangerId, role: "educator" }, engagement, [districtAdminId])).toBe(false);
        expect(userCanAccessEngagement({ _id: strangerId, role: "district_admin" }, engagement, [districtAdminId])).toBe(false);
        expect(userCanAccessEngagement({ _id: strangerId, role: "district_admin" }, engagement, null)).toBe(false);
    });
});

describe("startOfMonth", () => {
    it("anchors district placement KPIs to the first of the month of the client-passed now", () => {
        const midAugust = new Date(2026, 7, 19, 12).getTime();
        const start = startOfMonth(midAugust);
        const startDate = new Date(start);
        expect(startDate.getFullYear()).toBe(2026);
        expect(startDate.getMonth()).toBe(7);
        expect(startDate.getDate()).toBe(1);
    });
});
