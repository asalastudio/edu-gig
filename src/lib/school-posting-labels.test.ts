import { describe, expect, it } from "vitest";
import {
    PRIMARY_SUPPORT_AREA_LABEL,
    PRIMARY_SUPPORT_AREA_PUBLISH_MESSAGE,
    SPECIFIC_EXPERTISE_NEEDED_LABEL,
    SPECIFIC_EXPERTISE_NEEDED_PUBLISH_MESSAGE,
} from "./school-posting-labels";

describe("school posting labels", () => {
    it("uses Primary Support Area and Specific Expertise Needed for district posting", () => {
        expect(PRIMARY_SUPPORT_AREA_LABEL).toBe("Primary Support Area");
        expect(SPECIFIC_EXPERTISE_NEEDED_LABEL).toBe("Specific Expertise Needed");
        expect(PRIMARY_SUPPORT_AREA_PUBLISH_MESSAGE.toLowerCase()).toContain("primary support area");
        expect(SPECIFIC_EXPERTISE_NEEDED_PUBLISH_MESSAGE.toLowerCase()).toContain(
            "specific expertise needed"
        );
    });
});
