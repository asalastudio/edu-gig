import { describe, expect, it } from "vitest";
import { canInitiateConversation, canSendMessage } from "./messaging-policy";

describe("messaging-policy", () => {
    it("lets district-family roles initiate conversations", () => {
        for (const role of ["district_admin", "district_hr", "superintendent", "superadmin"]) {
            expect(canInitiateConversation(role)).toBe(true);
        }
    });

    it("does not let educators initiate conversations", () => {
        expect(canInitiateConversation("educator")).toBe(false);
    });

    it("blocks an educator from starting a new thread", () => {
        expect(
            canSendMessage({ senderRole: "educator", conversationHasMessages: false })
        ).toBe(false);
    });

    it("lets an educator reply once a district has started the thread", () => {
        expect(
            canSendMessage({ senderRole: "educator", conversationHasMessages: true })
        ).toBe(true);
    });

    it("lets a district start a new thread", () => {
        expect(
            canSendMessage({ senderRole: "district_hr", conversationHasMessages: false })
        ).toBe(true);
    });
});
