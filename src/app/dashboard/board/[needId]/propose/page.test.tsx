import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";

const state = vi.hoisted(() => ({ proposalStatus: "accepted" as "accepted" | "pending" }));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: vi.fn() }) }));
vi.mock("next/navigation", () => ({
    useParams: () => ({ needId: "need-1" }),
    useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("convex/react", () => ({
    useMutation: () => vi.fn(),
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "users:viewer") return { _id: "educator-user", role: "educator" };
        if (name === "needs:listOpenForEducators") return [{ _id: "need-1", orgName: "Reopened District", areaOfNeed: "leadership", status: "open", createdAt: Date.now() }];
        if (name === "proposals:listMine") return [{ _id: "proposal-old", needId: "need-1", status: state.proposalStatus }];
        if (name === "educators:getMine") return { _id: "educator-1", resumePrivateFileId: "resume-1", resumeFileName: "resume.pdf" };
        return undefined;
    },
}));
vi.mock("@/components/shared/sidebar", () => ({ Sidebar: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() }, Toaster: () => null }));

import ProposePage from "./page";

describe("proposal replacement after an explicit reopen", () => {
    afterEach(() => { cleanup(); state.proposalStatus = "accepted"; });

    it("allows a replacement proposal when the only prior proposal was historically accepted", () => {
        state.proposalStatus = "accepted";
        render(<ProposePage />);
        expect(screen.getByRole("button", { name: /send proposal to reopened district/i })).toBeInTheDocument();
        expect(screen.queryByText(/already submitted/i)).not.toBeInTheDocument();
    });

    it("continues to block a duplicate pending proposal", () => {
        state.proposalStatus = "pending";
        render(<ProposePage />);
        expect(screen.getByText(/already submitted a proposal/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /send proposal/i })).not.toBeInTheDocument();
    });
});
