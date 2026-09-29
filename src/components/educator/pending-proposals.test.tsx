import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PendingProposalsSection } from "./pending-proposals";

vi.mock("next/link", () => ({
    default: ({
        children,
        href,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

const submittedAt = Date.UTC(2026, 8, 10);

describe("PendingProposalsSection", () => {
    it("shows a short empty state when there are no pending rows", () => {
        render(
            <PendingProposalsSection
                proposals={[
                    {
                        _id: "p1",
                        needId: "n1",
                        orgName: "Oakland USD",
                        areaOfNeed: "ai_edtech",
                        createdAt: submittedAt,
                        status: "withdrawn",
                    },
                ]}
            />
        );
        expect(screen.getByText(/No pending proposals/i)).toBeInTheDocument();
        expect(screen.queryByText(/Oakland USD/)).not.toBeInTheDocument();
    });

    it("lists pending proposals with org, date, and a link to the proposal view", () => {
        render(
            <PendingProposalsSection
                proposals={[
                    {
                        _id: "p2",
                        needId: "need-abc",
                        orgName: "Oakland USD",
                        areaOfNeed: "ai_edtech",
                        subCategory: "ai_policy_governance",
                        createdAt: submittedAt,
                        status: "pending",
                    },
                ]}
            />
        );
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/dashboard/board/need-abc/propose");
        expect(link).toHaveTextContent(/Oakland USD/);
        expect(link).toHaveTextContent(/Submitted/);
    });
});
