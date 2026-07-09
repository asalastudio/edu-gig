import { describe, expect, it } from "vitest";
import { educatorMatchesNeed } from "./match-need";

describe("educatorMatchesNeed", () => {
    it("matches canonical need areas to educator legacy aliases", () => {
        expect(
            educatorMatchesNeed(
                { areasOfNeed: ["math"], gradeLevelBands: ["6_8"] },
                { areaOfNeed: "instruction_curriculum", gradeLevel: "6_8" }
            )
        ).toBe(true);
    });

    it("rejects unrelated areas and incompatible grade bands", () => {
        expect(
            educatorMatchesNeed(
                { areasOfNeed: ["data_accountability"], gradeLevelBands: ["6_8"] },
                { areaOfNeed: "instruction_curriculum", gradeLevel: "6_8" }
            )
        ).toBe(false);
        expect(
            educatorMatchesNeed(
                { areasOfNeed: ["instruction_curriculum"], gradeLevelBands: ["k5"] },
                { areaOfNeed: "instruction_curriculum", gradeLevel: "9_12" }
            )
        ).toBe(false);
    });

    it("treats all-grades educators as grade-compatible", () => {
        expect(
            educatorMatchesNeed(
                { areasOfNeed: ["instruction_curriculum"], gradeLevelBands: ["all"] },
                { areaOfNeed: "instruction_curriculum", gradeLevel: "9_12" }
            )
        ).toBe(true);
    });
});
