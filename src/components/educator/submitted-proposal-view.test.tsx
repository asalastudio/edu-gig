import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SubmittedProposalView } from "./submitted-proposal-view";
import type { Id } from "@/convex/_generated/dataModel";

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

vi.mock("@/components/shared/proposal-attachment-link", () => ({
    ProposalAttachmentLink: ({ attachmentName }: { attachmentName?: string }) => (
        <span>{attachmentName ?? "View attachment"}</span>
    ),
}));

const need = {
    orgName: "Oakland USD",
    areaOfNeed: "ai_edtech",
    subCategory: "ai_policy_governance",
    gradeLevel: "k5",
    compensationRange: "$75–$125/hr",
    description: "Need help writing an AI policy.",
};

const proposal = {
    _id: "j57proposal000000000000000" as Id<"proposals">,
    message: "I can draft the policy and train staff.",
    proposedRate: 95,
    proposedRateUnit: "hourly" as const,
    attachmentStorageId: "kg2file000000000000000000" as Id<"_storage">,
    attachmentName: "resume.pdf",
    createdAt: Date.UTC(2026, 8, 10),
    status: "pending" as const,
};

describe("SubmittedProposalView", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the need summary, proposal details, and status", () => {
        render(<SubmittedProposalView need={need} proposal={proposal} />);
        expect(screen.getByText("Proposal already submitted")).toBeInTheDocument();
        expect(screen.getByText("Oakland USD")).toBeInTheDocument();
        expect(screen.getByText(/Need help writing an AI policy/)).toBeInTheDocument();
        expect(screen.getByText(/I can draft the policy and train staff/)).toBeInTheDocument();
        expect(screen.getByText("$95/hr")).toBeInTheDocument();
        expect(screen.getByText("resume.pdf")).toBeInTheDocument();
        expect(screen.getByText("Pending")).toBeInTheDocument();
        expect(screen.getByText("$75–$125/hr")).toBeInTheDocument();
        expect(screen.getByText("K–5")).toBeInTheDocument();
    });

    it("shows Withdraw proposal only while pending and confirms before calling onWithdraw", async () => {
        const user = userEvent.setup();
        const onWithdraw = vi.fn();
        render(
            <SubmittedProposalView need={need} proposal={proposal} onWithdraw={onWithdraw} />
        );
        await user.click(screen.getByRole("button", { name: /withdraw proposal/i }));
        expect(onWithdraw).not.toHaveBeenCalled();
        const dialog = screen.getByRole("alertdialog");
        expect(within(dialog).getByText(/The district will no longer see it as pending/i)).toBeInTheDocument();
        await user.click(within(dialog).getByRole("button", { name: /withdraw proposal/i }));
        expect(onWithdraw).toHaveBeenCalledTimes(1);
    });

    it("hides the withdraw button when the proposal is accepted", () => {
        render(
            <SubmittedProposalView
                need={need}
                proposal={{ ...proposal, status: "accepted" }}
                onWithdraw={vi.fn()}
            />
        );
        expect(screen.queryByRole("button", { name: /withdraw proposal/i })).not.toBeInTheDocument();
        expect(screen.getByText("Accepted")).toBeInTheDocument();
    });
});
