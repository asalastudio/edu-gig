import { describe, expect, it } from "vitest";
import { EDUCATOR_DASHBOARD_SUBTITLE } from "./dashboard-copy";

describe("EDUCATOR_DASHBOARD_SUBTITLE", () => {
    it("does not mention contract documents or Contract Hub", () => {
        expect(EDUCATOR_DASHBOARD_SUBTITLE).toMatch(/accepted gigs/i);
        expect(EDUCATOR_DASHBOARD_SUBTITLE).toMatch(/pending proposals/i);
        expect(EDUCATOR_DASHBOARD_SUBTITLE).not.toMatch(/contract documents/i);
        expect(EDUCATOR_DASHBOARD_SUBTITLE).not.toMatch(/Contract Hub/i);
    });
});
