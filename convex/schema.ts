import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

    // ─── Users ───────────────────────────────────────────────
    users: defineTable({
        clerkId: v.string(),
        role: v.union(v.literal("educator"), v.literal("district_admin"), v.literal("district_hr"), v.literal("superintendent"), v.literal("superadmin")),
        email: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        avatarUrl: v.optional(v.string()),
        onboarded: v.boolean(),
        createdAt: v.number(),
    }).index("by_clerk_id", ["clerkId"]),

    // ─── Educator Profiles ────────────────────────────────────
    educators: defineTable({
        userId: v.id("users"),
        headline: v.string(),
        bio: v.string(),
        videoIntroUrl: v.optional(v.string()),
        yearsExperience: v.number(),
        gradeLevelBands: v.array(v.string()),    // ["k5", "6_8", "9_12", "all"]
        areasOfNeed: v.array(v.string()),    // taxonomy codes
        subCategories: v.array(v.string()),    // drill-down taxonomy
        engagementTypes: v.array(v.string()),    // ["permanent", "substitute", "consulting"]
        coverageRegions: v.array(v.string()),    // ["region_1", "region_2" ... "all"]
        stateLicenses: v.array(v.id("credentials")),
        verificationStatus: v.union(
            v.literal("unverified"),
            v.literal("pending"),
            v.literal("verified"),
            v.literal("premier")
        ),
        availabilityStatus: v.union(
            v.literal("open"),
            v.literal("limited"),
            v.literal("closed")
        ),
        hourlyRate: v.optional(v.number()),
        dailyRate: v.optional(v.number()),
        backgroundCheckId: v.optional(v.string()),   // Checkr report ID
        isActive: v.boolean(),
        profileCompletePct: v.number(),
    }).index("by_user_id", ["userId"])
        .index("by_verification", ["verificationStatus"])
        .searchIndex("search_educators", {
            searchField: "headline",
            filterFields: ["areasOfNeed", "gradeLevelBands", "coverageRegions", "verificationStatus"],
        }),

    // ─── Credentials ─────────────────────────────────────────
    credentials: defineTable({
        educatorId: v.id("educators"),
        type: v.union(
            v.literal("state_license"),
            v.literal("certification"),
            v.literal("degree"),
            v.literal("endorsement")
        ),
        title: v.string(),
        issuingBody: v.string(),
        state: v.optional(v.string()),
        issueDate: v.string(),
        expiryDate: v.optional(v.string()),
        documentUrl: v.optional(v.string()),
        verified: v.boolean(),
    }).index("by_educator", ["educatorId"]),

    // ─── District Accounts (Multi-Tenant) ────────────────────
    districts: defineTable({
        name: v.string(),
        state: v.string(),
        region: v.string(),
        nceaId: v.optional(v.string()),
        adminIds: v.array(v.id("users")),
        planType: v.union(
            v.literal("free"),
            v.literal("essential"),
            v.literal("professional"),
            v.literal("enterprise")
        ),
        stripeCustomerId: v.optional(v.string()),
        createdAt: v.number(),
    }),

    // ─── Gigs (Educator Service Listings) ────────────────────
    gigs: defineTable({
        educatorId: v.id("educators"),
        title: v.string(),
        description: v.string(),
        areaOfNeed: v.string(),              // taxonomy code
        subCategory: v.optional(v.string()),
        engagementType: v.string(),
        gradeLevels: v.array(v.string()),
        coverageRegions: v.array(v.string()),
        deliverables: v.array(v.string()),
        pricingType: v.union(v.literal("hourly"), v.literal("daily"), v.literal("fixed")),
        price: v.number(),
        estimatedDuration: v.optional(v.string()),
        isActive: v.boolean(),
        createdAt: v.number(),
    }).index("by_educator", ["educatorId"])
        .searchIndex("search_gigs", {
            searchField: "title",
            filterFields: ["areaOfNeed", "gradeLevels", "coverageRegions", "engagementType"],
        }),

    // ─── Orders / Placements ─────────────────────────────────
    orders: defineTable({
        gigId: v.id("gigs"),
        educatorId: v.id("educators"),
        districtId: v.id("districts"),
        buyerUserId: v.id("users"),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("in_progress"),
            v.literal("completed"),
            v.literal("cancelled"),
            v.literal("disputed")
        ),
        engagementType: v.string(),
        startDate: v.string(),
        endDate: v.optional(v.string()),
        totalAmount: v.number(),
        platformFee: v.number(),
        educatorPayout: v.number(),
        stripePaymentIntentId: v.optional(v.string()),
        poNumber: v.optional(v.string()),
        paymentMethod: v.union(v.literal("card"), v.literal("ach"), v.literal("invoice")),
        createdAt: v.number(),
    }).index("by_district", ["districtId"])
        .index("by_educator", ["educatorId"])
        .index("by_status", ["status"]),

    // ─── Reviews ─────────────────────────────────────────────
    reviews: defineTable({
        orderId: v.id("orders"),
        reviewerRole: v.union(v.literal("buyer"), v.literal("seller")),
        revieweeId: v.id("users"),
        overallRating: v.number(),
        subjectExpertise: v.optional(v.number()),
        classroomMgmt: v.optional(v.number()),
        communication: v.optional(v.number()),
        reliability: v.optional(v.number()),
        comment: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_reviewee", ["revieweeId"]),

    // ─── Messages ─────────────────────────────────────────────
    messages: defineTable({
        conversationId: v.string(),
        senderId: v.id("users"),
        recipientId: v.id("users"),
        content: v.string(),
        read: v.boolean(),
        createdAt: v.number(),
    }).index("by_conversation", ["conversationId"]),

    // ─── Notifications ────────────────────────────────────────
    notifications: defineTable({
        userId: v.id("users"),
        type: v.string(),
        title: v.string(),
        body: v.string(),
        read: v.boolean(),
        actionUrl: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_user", ["userId"]),

});
