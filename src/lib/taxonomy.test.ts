import { describe, expect, it } from "vitest";
import { TAXONOMY } from "./taxonomy";

describe("TAXONOMY.engagementTypes", () => {
    it("keeps consulting as the stored default even though the picker is hidden", () => {
        expect(TAXONOMY.engagementTypes[0].id).toBe("consulting");
    });
});

describe("TAXONOMY support types", () => {
    it("lists Keynote speaking under Leadership & Operations", () => {
        const leadership = TAXONOMY.areasOfNeed.find((area) => area.id === "leadership_operations");
        expect(leadership?.subCategories.some((sub) => sub.id === "keynote" && sub.label === "Keynote speaking")).toBe(true);
    });
});
