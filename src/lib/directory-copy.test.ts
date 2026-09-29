import { describe, expect, it } from "vitest";
import { VERIFIED_ONLY_HELPER } from "./directory-copy";

describe("VERIFIED_ONLY_HELPER", () => {
    it("explains what Verified means on K12Gig", () => {
        expect(VERIFIED_ONLY_HELPER).toMatch(/background check/i);
        expect(VERIFIED_ONLY_HELPER).toMatch(/license/i);
    });
});
