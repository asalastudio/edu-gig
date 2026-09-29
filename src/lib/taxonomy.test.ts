import { describe, expect, it } from "vitest";
import { TAXONOMY, formatNeedTitle, getAreaOfNeedLabel, getAreaOfNeedMatchIds } from "./taxonomy";

describe("TAXONOMY.engagementTypes", () => {
    it("keeps consulting as the stored default even though the picker is hidden", () => {
        expect(TAXONOMY.engagementTypes[0].id).toBe("consulting");
    });
});

describe("TAXONOMY support types", () => {
    it("lists Keynote Speaking as a top-level Support Type", () => {
        const keynote = TAXONOMY.areasOfNeed.find((area) => area.id === "keynote");
        expect(keynote?.label).toBe("Keynote Speaking");
        expect(keynote?.subCategories).toEqual([]);
    });

    it("does not keep Keynote as a Leadership & Operations expertise option", () => {
        const leadership = TAXONOMY.areasOfNeed.find((area) => area.id === "leadership_operations");
        const leftoverIds = (leadership?.subCategories ?? []).map((sub) => String(sub.id));
        expect(leftoverIds).not.toContain("keynote");
    });

    it("resolves stored keynote ids to the top-level label", () => {
        expect(getAreaOfNeedLabel("keynote")).toBe("Keynote Speaking");
    });

    it("resolves raw taxonomy ids to human-readable labels for emails", () => {
        expect(getAreaOfNeedLabel("ai_edtech")).toBe("AI & Educational Technology");
        expect(formatNeedTitle("ai_edtech")).toBe("AI & Educational Technology");
        expect(formatNeedTitle("", "your posting")).toBe("your posting");
        expect(formatNeedTitle(undefined, "the posting")).toBe("the posting");
    });

    it("matches Keynote independently from Leadership & Operations", () => {
        expect(getAreaOfNeedMatchIds("keynote")).toEqual(["keynote"]);
        expect(getAreaOfNeedMatchIds("leadership_operations")).not.toContain("keynote");
    });
});
