import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";

const mocks = vi.hoisted(() => ({
    revision: 4,
    transition: vi.fn(),
    retry: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useParams: () => ({ engagementId: "engagement-1" }),
    useSearchParams: () => new URLSearchParams("agreement=contract-1&version=version-2"),
}));
vi.mock("convex/react", () => ({
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === "engagements:transition" ? mocks.transition : mocks.retry,
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "users:viewer") return { _id: "district-user", role: "district_admin" };
        if (name === "engagements:getById") return {
            engagement: { _id: "engagement-1", revision: mocks.revision, needId: "need-1", status: "active", areaOfNeed: "leadership", orgName: "Synthetic District", consultantName: "Alex Morgan", archivedForViewer: false, partyAccess: true },
            counterpartUserId: "consultant-user", counterpartName: "Alex Morgan",
        };
        if (name === "engagements:activity") return [];
        if (name === "delivery:listForEngagement") return [{ outboxId: "delivery-1", state: "failed", title: "Agreement update", attempts: 1, lastError: "Synthetic failure", createdAt: Date.now(), updatedAt: Date.now(), history: [], canRetry: false }];
        return undefined;
    },
}));
vi.mock("@/components/shared/sidebar", () => ({ Sidebar: () => null }));

import EngagementDetailPage from "./page";

describe("engagement handoff and immutable transitions", () => {
    beforeEach(() => {
        mocks.revision = 4;
        mocks.transition.mockReset().mockRejectedValueOnce(new Error("Response lost")).mockResolvedValue({ revision: 5 });
        mocks.retry.mockReset();
    });
    afterEach(cleanup);

    it("preserves notification agreement/version context in the Contract Hub link", () => {
        render(<EngagementDetailPage />);
        expect(screen.getByRole("link", { name: "Open Contract Hub" })).toHaveAttribute("href", "/dashboard/district/contract-hub?engagement=engagement-1&agreement=contract-1&version=version-2");
    });

    it("replays the exact transition snapshot after a lost response and reactive revision", async () => {
        const user = userEvent.setup();
        const { rerender } = render(<EngagementDetailPage />);
        await user.click(screen.getByRole("button", { name: "Mark in progress" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Response lost");
        const first = mocks.transition.mock.calls[0][0];

        mocks.revision = 5;
        rerender(<EngagementDetailPage />);
        await user.click(screen.getByRole("button", { name: "Mark in progress" }));
        await waitFor(() => expect(mocks.transition).toHaveBeenCalledTimes(2));

        expect(mocks.transition.mock.calls[1][0]).toEqual(first);
    });

    it("does not show recipient-only Retry delivery when the server capability is false", () => {
        render(<EngagementDetailPage />);
        expect(screen.queryByRole("button", { name: "Retry delivery" })).not.toBeInTheDocument();
        expect(screen.getByText(/reconcile this delivery manually/i)).toBeInTheDocument();
    });
});
