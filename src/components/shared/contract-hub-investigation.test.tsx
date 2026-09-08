import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";

vi.hoisted(() => { process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test"; });

const mocks = vi.hoisted(() => ({
    getToken: vi.fn().mockResolvedValue("test-convex-jwt"),
    requestUpload: vi.fn(),
    uploadPrivateFile: vi.fn(),
    createDraft: vi.fn(),
    share: vi.fn(),
    agreements: [] as Array<Record<string, unknown>>,
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: mocks.getToken }) }));
vi.mock("@/lib/private-upload", () => ({ uploadPrivateFile: mocks.uploadPrivateFile, privateFileMime: (file: File) => file.type || "application/pdf" }));
vi.mock("convex/react", () => ({
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "users:viewer") return { _id: "district-user", role: "district_admin" };
        if (name === "engagements:listMine") return [{
            _id: "engagement-1", revision: 0, archivedForViewer: false, buyerUserId: "district-user", educatorUserId: "educator-user",
            orgName: "Synthetic District", consultantName: "Alex Morgan",
            title: "Literacy support", status: "active",
        }];
        if (name === "agreementVersions:listForEngagement") return mocks.agreements;
        return [];
    },
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "privateFiles:requestUpload") return mocks.requestUpload;
        if (name === "agreementVersions:createDraft") return mocks.createDraft;
        if (name === "agreementVersions:share") return mocks.share;
        return vi.fn();
    },
}));
vi.mock("@/components/shared/sidebar", () => ({ Sidebar: () => null }));

import { ContractHub } from "./contract-hub";

describe("ContractHub private agreement flow", () => {
    beforeEach(() => {
        mocks.agreements = [];
        mocks.requestUpload.mockReset().mockResolvedValue({ ticketId: "ticket-1", expiresAt: Date.now() + 60_000, uploadPath: "/private-files/upload" });
        mocks.uploadPrivateFile.mockReset().mockResolvedValue({ privateFileId: "private-file-1" });
        mocks.createDraft.mockReset().mockResolvedValue({ contractId: "contract-1", versionId: "version-1", revision: 1 });
        mocks.share.mockReset().mockResolvedValue({ contractId: "contract-1", versionId: "version-1", revision: 2 });
        mocks.getToken.mockClear();
    });

    afterEach(() => { cleanup(); window.history.replaceState({}, "", "/"); vi.restoreAllMocks(); });

    it("does not create an agreement when its file upload fails and retries the same selection", async () => {
        const user = userEvent.setup();
        mocks.uploadPrivateFile.mockRejectedValueOnce(new Error("Upload session expired"));
        render(<ContractHub role="district" />);

        await user.selectOptions(screen.getByLabelText("Engagement"), "engagement-1");
        const file = new File(["agreement"], "same-long-synthetic-agreement-filename.pdf", { type: "application/pdf" });
        await user.upload(screen.getByLabelText("Agreement file"), file);
        await user.click(screen.getByRole("button", { name: "Save private draft" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Upload session expired");
        expect(mocks.createDraft).not.toHaveBeenCalled();
        expect(screen.getByText(file.name)).toBeInTheDocument();

        const firstRequestId = mocks.requestUpload.mock.calls[0][0].requestId;
        await user.click(screen.getByRole("button", { name: "Retry upload" }));
        await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledTimes(1));
        expect(mocks.requestUpload.mock.calls[1][0].requestId).toBe(firstRequestId);
    });

    it("saves a selected file privately and never shares it until the author chooses Share", async () => {
        const user = userEvent.setup();
        render(<ContractHub role="district" />);
        await user.selectOptions(screen.getByLabelText("Engagement"), "engagement-1");
        await user.upload(screen.getByLabelText("Agreement file"), new File(["agreement"], "scope.pdf", { type: "application/pdf" }));
        await user.click(screen.getByRole("button", { name: "Save private draft" }));

        await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledTimes(1));
        expect(mocks.share).not.toHaveBeenCalled();
        expect(await screen.findByText(/saved privately/i)).toBeInTheDocument();
    });

    it("renders navigation as links and actions as buttons without nesting interactive controls", () => {
        mocks.agreements = [{
            contractId: "contract-1", title: "Consulting agreement", revision: 1,
            status: "draft", currentVersionState: "none", legacy: false,
            versions: [{ versionId: "version-1", privateFileId: "private-file-1", number: 1,
                kind: "original", fileName: "scope.pdf", uploadedByUserId: "district-user",
                uploaderName: "Dana District", createdAt: Date.now(), coordinationState: "draft",
                downloadUrl: "/api/private-files/private-file-1", isMine: true }],
            activity: [],
            allowedActions: { attachFirstVersion: false, upload: true, share: true, signedCopy: false, recordSigning: false },
        }];
        const { container } = render(<ContractHub role="district" />);

        expect(screen.getByRole("link", { name: /open agreement in engagement/i })).toHaveAttribute("href", "/dashboard/engagements/engagement-1?agreement=contract-1&version=version-1");
        expect(screen.getByRole("button", { name: /share version 1/i })).toBeInTheDocument();
        expect(container.querySelector("a button, button a")).toBeNull();
    });

    it("honors engagement, agreement, and version deep-link context", async () => {
        HTMLElement.prototype.scrollIntoView = vi.fn();
        window.history.replaceState({}, "", "/dashboard/district/contract-hub?engagement=engagement-1&agreement=contract-1&version=version-1");
        mocks.agreements = [{
            contractId: "contract-1", title: "Context agreement", revision: 1,
            status: "draft", currentVersionState: "none", legacy: false,
            versions: [{ versionId: "version-1", privateFileId: "private-file-1", number: 1,
                kind: "original", fileName: "context.pdf", uploadedByUserId: "district-user",
                uploaderName: "Dana District", createdAt: Date.now(), coordinationState: "draft",
                downloadUrl: "/api/private-files/private-file-1", isMine: true }],
            activity: [],
            allowedActions: { attachFirstVersion: false, upload: true, share: true, signedCopy: false, recordSigning: false },
        }];

        render(<ContractHub role="district" />);

        await waitFor(() => expect(screen.getByLabelText("Engagement")).toHaveValue("engagement-1"));
        expect(document.getElementById("agreement-version-version-1")).toHaveClass("ring-2");
        expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
});
