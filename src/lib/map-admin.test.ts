import { describe, expect, it } from "vitest";
import {
    adminEmptyState,
    adminRoleLabel,
    canAccessAdmin,
    formatAdminDate,
    formatAdminMoney,
    orderStatusLabel,
    orderStatusTone,
    procurementStatusLabel,
    procurementStatusTone,
    verificationStatusLabel,
    verificationStatusTone,
} from "./map-admin";

describe("admin view-model helpers", () => {
    it("labels roles without exposing raw ids", () => {
        expect(adminRoleLabel("district_hr")).toBe("District HR");
        expect(adminRoleLabel("superadmin")).toBe("Superadmin");
        expect(adminRoleLabel("unknown")).toBe("Unknown");
    });

    it("keeps admin access limited to superadmins", () => {
        expect(canAccessAdmin("superadmin")).toBe(true);
        expect(canAccessAdmin("superintendent")).toBe(false);
        expect(canAccessAdmin(undefined)).toBe(false);
    });

    it("maps verification statuses to launch-friendly labels and tones", () => {
        expect(verificationStatusLabel("pending")).toBe("Pending review");
        expect(verificationStatusTone("verified")).toBe("emerald");
        expect(verificationStatusTone("unverified")).toBe("red");
    });

    it("maps procurement and order status badges", () => {
        expect(procurementStatusLabel("waiting_on_district")).toBe("Waiting on district");
        expect(procurementStatusTone("packet_sent")).toBe("emerald");
        expect(orderStatusLabel("in_progress")).toBe("In progress");
        expect(orderStatusTone("disputed")).toBe("red");
    });

    it("formats money, dates, and empty-state copy", () => {
        expect(formatAdminMoney(125000)).toBe("$125,000");
        expect(formatAdminDate(new Date(2026, 0, 15).getTime())).toBe("Jan 15, 2026");
        expect(adminEmptyState("users")).toBe("No users found");
    });
});
