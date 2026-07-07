import { describe, expect, it } from "vitest";
import { TAXONOMY } from "./taxonomy";

describe("TAXONOMY.engagementTypes", () => {
    it("exposes all three engagement types so the browse filter renders", () => {
        const ids = TAXONOMY.engagementTypes.map((t) => t.id);
        expect(ids).toEqual(["consulting", "permanent", "substitute"]);
        // The browse page hides the filter unless more than one option exists.
        expect(TAXONOMY.engagementTypes.length).toBeGreaterThan(1);
    });

    it("keeps consulting first (default selection for new profiles)", () => {
        expect(TAXONOMY.engagementTypes[0].id).toBe("consulting");
    });
});
