import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EducatorCard, type EducatorCardProps } from "./educator-card";

const educator: EducatorCardProps = {
    id: "educator_1",
    name: "Multi-area Educator",
    headline: "District improvement partner",
    verificationTier: "basic",
    overallRating: 0,
    reviewCount: 0,
    gradeLevels: ["all"],
    areasOfNeed: ["data_accountability", "ai_edtech", "instruction_curriculum"],
    engagementTypes: ["consulting"],
    coverageRegions: ["all"],
    availabilityStatus: "open",
    hasVideoIntro: false,
};

describe("EducatorCard", () => {
    it("shows the support area responsible for an active filter match first", () => {
        render(
            <EducatorCard
                educator={educator}
                highlightedAreaIds={["instruction_curriculum"]}
            />
        );

        expect(screen.getByText("Instruction & Curriculum")).toBeInTheDocument();
        expect(screen.getByText("+2 more")).toBeInTheDocument();
        expect(screen.getByText(/Grades: All Grades/)).toBeInTheDocument();
    });
});
