import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { getFunctionName } from "convex/server";

const mocks = vi.hoisted(() => ({ accept: vi.fn(), reject: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
    useParams: () => ({ needId: "abcdefghijklmnopqrstuv" }),
    useRouter: () => ({ push: mocks.push }),
}));
vi.mock("convex/react", () => ({
    useConvex: () => ({ query: vi.fn() }),
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "users:viewer") return { _id: "district-user", role: "district_admin" };
        if (name === "needs:getById") return { _id: "abcdefghijklmnopqrstuv", postedByUserId: "district-user", orgName: "Synthetic District", areaOfNeed: "curriculum_instruction", status: "open", description: "Create a literacy implementation plan.", createdAt: Date.now() };
        if (name === "proposals:listForNeed") return [{
            proposal: { _id: "proposal-1", status: "pending", message: "I will deliver a six-week literacy plan and staff workshop.", proposedRate: 2400, proposedRateUnit: "fixed", createdAt: Date.now() },
            user: { firstName: "Alex", lastName: "Morgan" },
        }];
        return undefined;
    },
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === "proposals:accept" ? mocks.accept : mocks.reject,
}));
vi.mock("@/components/shared/sidebar", () => ({ Sidebar: () => null }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() }, Toaster: () => null }));

import DistrictNeedDetailPage from "./page";

describe("proposal acceptance confirmation", () => {
    afterEach(cleanup);
    beforeEach(() => {
        mocks.accept.mockReset().mockResolvedValue({ proposalId: "proposal-1", engagementId: "engagement-1" });
        mocks.reject.mockReset();
        mocks.push.mockReset();
    });

    it("shows the consultant, need, scope, rate and single-hire consequence before accepting", async () => {
        const user = userEvent.setup();
        render(<DistrictNeedDetailPage />);
        const trigger = screen.getByRole("button", { name: "Accept" });
        await user.click(trigger);

        const dialog = screen.getByRole("alertdialog", { name: /accept alex morgan/i });
        expect(dialog).toHaveTextContent("Synthetic District");
        expect(dialog).toHaveTextContent("six-week literacy plan");
        expect(dialog).toHaveTextContent("$2,400 flat");
        expect(dialog).toHaveTextContent(/other pending proposals/i);
        expect(mocks.accept).not.toHaveBeenCalled();
    });

    it("closes on Back without mutation and returns focus to the Accept button", async () => {
        const user = userEvent.setup();
        render(<DistrictNeedDetailPage />);
        const trigger = screen.getByRole("button", { name: "Accept" });
        await user.click(trigger);
        await user.click(screen.getByRole("button", { name: "Back" }));

        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
        expect(mocks.accept).not.toHaveBeenCalled();
        expect(trigger).toHaveFocus();
    });
});
