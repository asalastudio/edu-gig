import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAccountNav } from "./use-account-nav";

const clerk = { isLoaded: true, isSignedIn: true };
let viewer: { onboarded: boolean; role: string } | null | undefined;

vi.mock("@clerk/nextjs", () => ({ useUser: () => clerk }));
vi.mock("convex/react", () => ({ useQuery: () => viewer }));
vi.mock("@/convex/_generated/api", () => ({ api: { users: { viewer: {} } } }));

describe("useAccountNav", () => {
    beforeEach(() => {
        clerk.isLoaded = true;
        clerk.isSignedIn = true;
        viewer = null;
    });

    it("flags onboarded consultants so nav shows the Gig Board instead of Post a gig", () => {
        viewer = { onboarded: true, role: "educator" };
        const { result } = renderHook(() => useAccountNav());
        expect(result.current).toMatchObject({
            signedIn: true,
            isConsultant: true,
            dashboardHref: "/dashboard/educator",
            dashboardLabel: "Dashboard",
        });
    });

    it("sends districts to the district dashboard and keeps Post a gig", () => {
        viewer = { onboarded: true, role: "district_hr" };
        const { result } = renderHook(() => useAccountNav());
        expect(result.current).toMatchObject({ isConsultant: false, dashboardHref: "/dashboard/district" });
    });

    it("points signed-in users who haven't onboarded at Finish setup", () => {
        viewer = null;
        const { result } = renderHook(() => useAccountNav());
        expect(result.current).toMatchObject({
            signedIn: true,
            isConsultant: false,
            dashboardHref: "/onboarding",
            dashboardLabel: "Finish setup",
        });
    });

    it("is loading until the Convex profile arrives for a signed-in user", () => {
        viewer = undefined;
        const { result } = renderHook(() => useAccountNav());
        expect(result.current.loading).toBe(true);
    });

    it("reads as signed out when Clerk has no session", () => {
        clerk.isSignedIn = false;
        const { result } = renderHook(() => useAccountNav());
        expect(result.current).toMatchObject({ signedIn: false, isConsultant: false, loading: false });
    });
});
