// @vitest-environment node
import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { seeded } from "./release-test-fixture";

describe("message-to-posting handoff", () => {
    it("returns the counterpart educator document ID for an existing direct conversation", async () => {
        const { t, as, rows } = await seeded();
        const consultant = rows.users.find((user) => user.firstName === "consultant-b")!;
        const educator = await t.run((ctx) => ctx.db.query("educators").withIndex("by_user_id", (q) => q.eq("userId", consultant._id)).unique());
        await as("district-a").mutation(api.messages.send, { recipientUserId: consultant._id, content: "Are you available?" });

        const conversations = await as("district-a").query(api.messages.listMyConversations, {});

        expect(conversations.find((row) => row.counterpartId === consultant._id)?.counterpartEducatorId).toBe(educator?._id);
    });
});
