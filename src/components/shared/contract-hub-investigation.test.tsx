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
    saveVersion: vi.fn(),
    viewer: { _id: "district-user", role: "district_admin" },
    engagements: [] as Array<Record<string, unknown>>,
    agreements: [] as Array<Record<string, unknown>>,
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: mocks.getToken }) }));
vi.mock("@/lib/private-upload", () => ({ uploadPrivateFile: mocks.uploadPrivateFile, privateFileMime: (file: File) => file.type || "application/pdf" }));
vi.mock("convex/react", () => ({
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "users:viewer") return mocks.viewer;
        if (name === "engagements:listMine") return mocks.engagements;
        if (name === "agreementVersions:listForEngagement") return mocks.agreements;
        return [];
    },
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "privateFiles:requestUpload") return mocks.requestUpload;
        if (name === "agreementVersions:createDraft") return mocks.createDraft;
        if (name === "agreementVersions:share") return mocks.share;
        if (name === "agreementVersions:saveVersion") return mocks.saveVersion;
        return vi.fn();
    },
}));
vi.mock("@/components/shared/sidebar", () => ({ Sidebar: () => null }));

import { ContractHub } from "./contract-hub";

describe("ContractHub private agreement flow", () => {
    beforeEach(() => {
        mocks.viewer = { _id: "district-user", role: "district_admin" };
        mocks.engagements = [{
            _id: "engagement-1", revision: 0, archivedForViewer: false, partyAccess: true,
            buyerUserId: "district-user", educatorUserId: "educator-user",
            orgName: "Synthetic District", consultantName: "Alex Morgan",
            title: "Literacy support", status: "active",
        }];
        mocks.agreements = [];
        mocks.requestUpload.mockReset().mockResolvedValue({ ticketId: "ticket-1", expiresAt: Date.now() + 60_000, uploadPath: "/private-files/upload" });
        mocks.uploadPrivateFile.mockReset().mockResolvedValue({ privateFileId: "private-file-1" });
        mocks.createDraft.mockReset().mockResolvedValue({ contractId: "contract-1", versionId: "version-1", revision: 1 });
        mocks.share.mockReset().mockResolvedValue({ contractId: "contract-1", versionId: "version-1", revision: 2 });
        mocks.saveVersion.mockReset().mockResolvedValue({ contractId: "contract-1", versionId: "version-2", revision: 2 });
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

    it("constrains every new-agreement control when engagement names are long", () => {
        mocks.engagements = [{
            ...mocks.engagements[0],
            orgName: "A very long synthetic district organization name that must not widen the form",
            title: "A very long accepted engagement title that must remain inside a narrow mobile card",
        }];
        render(<ContractHub role="district" />);

        for (const control of [
            screen.getByLabelText("Engagement"),
            screen.getByLabelText("Agreement title"),
            screen.getByLabelText("Notes"),
            screen.getByLabelText("Agreement file"),
        ]) {
            expect(control).toHaveClass("w-full", "min-w-0", "max-w-full");
            expect(control.closest("label")).toHaveClass("min-w-0");
        }
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

    it("uses server-derived party access for a district teammate and excludes an unrelated administrator", () => {
        mocks.viewer = { _id: "district-teammate", role: "district_hr" };
        mocks.engagements = [{ ...mocks.engagements[0], buyerUserId: "district-owner", partyAccess: true }];
        mocks.agreements = [{
            contractId: "contract-1", title: "Teammate agreement", revision: 1, status: "draft",
            currentVersionState: "none", legacy: false, versions: [], activity: [],
            allowedActions: { attachFirstVersion: true, upload: true, share: false, signedCopy: false, recordSigning: false },
        }];
        const { rerender } = render(<ContractHub role="district" />);
        expect(screen.getByText("Teammate agreement")).toBeInTheDocument();
        expect(screen.getByLabelText("Engagement")).toBeInTheDocument();

        mocks.viewer = { _id: "review-admin", role: "superadmin" };
        mocks.engagements = [{ ...mocks.engagements[0], partyAccess: false }];
        rerender(<ContractHub role="district" />);
        expect(screen.getByText(/administrative engagement summary only/i)).toBeInTheDocument();
        expect(screen.queryByText("Teammate agreement")).not.toBeInTheDocument();
    });

    it("starts a fresh upload operation when title and engagement change after failure", async () => {
        const user = userEvent.setup();
        mocks.engagements.push({ ...mocks.engagements[0], _id: "engagement-2", orgName: "Second District" });
        mocks.uploadPrivateFile.mockRejectedValueOnce(new Error("Connection interrupted"));
        render(<ContractHub role="district" />);
        await user.selectOptions(screen.getByLabelText("Engagement"), "engagement-1");
        await user.upload(screen.getByLabelText("Agreement file"), new File(["agreement"], "scope.pdf", { type: "application/pdf" }));
        await user.click(screen.getByRole("button", { name: "Save private draft" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Connection interrupted");
        const firstRequestId = mocks.requestUpload.mock.calls[0][0].requestId;

        await user.clear(screen.getByLabelText("Agreement title"));
        await user.type(screen.getByLabelText("Agreement title"), "Revised scope");
        await user.selectOptions(screen.getByLabelText("Engagement"), "engagement-2");
        await user.click(screen.getByRole("button", { name: "Save private draft" }));

        await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledTimes(1));
        expect(mocks.requestUpload.mock.calls[1][0]).toMatchObject({ engagementId: "engagement-2" });
        expect(mocks.requestUpload.mock.calls[1][0].requestId).not.toBe(firstRequestId);
        expect(mocks.createDraft.mock.calls[0][0]).toMatchObject({ engagementId: "engagement-2", title: "Revised scope" });
    });

    it("locks changed details and replays the exact create after an uncertain committed response", async () => {
        const user = userEvent.setup();
        mocks.createDraft.mockReset().mockRejectedValueOnce(new Error("Response lost")).mockResolvedValue({ contractId: "contract-1", versionId: "version-1", revision: 1 });
        render(<ContractHub role="district" />);
        await user.selectOptions(screen.getByLabelText("Engagement"), "engagement-1");
        await user.upload(screen.getByLabelText("Agreement file"), new File(["agreement"], "scope.pdf", { type: "application/pdf" }));
        await user.click(screen.getByRole("button", { name: "Save private draft" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Response lost");
        const first = mocks.createDraft.mock.calls[0][0];
        expect(screen.getByLabelText("Agreement title")).toBeDisabled();
        expect(screen.getByLabelText("Engagement")).toBeDisabled();
        expect(screen.getByText(/retry the unchanged save/i)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Retry unchanged save" }));
        await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledTimes(2));
        expect(mocks.createDraft.mock.calls[1][0]).toEqual(first);
        expect(mocks.requestUpload).toHaveBeenCalledTimes(1);
    });

    it("replays the selected engagement after URL context reacts during uncertain create recovery", async () => {
        const user = userEvent.setup();
        window.history.replaceState({}, "", "/dashboard/district/contract-hub?engagement=engagement-1");
        mocks.engagements = [
            mocks.engagements[0],
            { ...mocks.engagements[0], _id: "engagement-2", orgName: "Second District", title: "Math support" },
        ];
        mocks.createDraft.mockReset().mockRejectedValueOnce(new Error("Response lost")).mockResolvedValue({ contractId: "contract-2", versionId: "version-1", revision: 1 });
        const { rerender } = render(<ContractHub role="district" />);
        await waitFor(() => expect(screen.getByLabelText("Engagement")).toHaveValue("engagement-1"));

        await user.selectOptions(screen.getByLabelText("Engagement"), "engagement-2");
        await user.upload(screen.getByLabelText("Agreement file"), new File(["agreement"], "scope.pdf", { type: "application/pdf" }));
        await user.click(screen.getByRole("button", { name: "Save private draft" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Response lost");
        const first = mocks.createDraft.mock.calls[0][0];
        expect(first).toMatchObject({ engagementId: "engagement-2" });

        mocks.engagements = mocks.engagements.map((engagement) => ({ ...engagement, revision: Number(engagement.revision) + 1 }));
        rerender(<ContractHub role="district" />);
        await user.click(screen.getByRole("button", { name: "Retry unchanged save" }));

        await waitFor(() => expect(mocks.createDraft).toHaveBeenCalledTimes(2));
        expect(mocks.createDraft.mock.calls[1][0]).toEqual(first);
        expect(mocks.requestUpload).toHaveBeenCalledTimes(1);
    });

    it("replays an immutable share snapshot after a committed response is lost and revision reacts", async () => {
        const user = userEvent.setup();
        mocks.agreements = [{
            contractId: "contract-1", title: "Replay agreement", revision: 1, status: "draft",
            currentVersionState: "none", legacy: false,
            versions: [{ versionId: "version-1", privateFileId: "private-file-1", number: 1, kind: "original", fileName: "scope.pdf", uploaderName: "Dana District", createdAt: Date.now(), coordinationState: "draft", downloadUrl: "/api/private-files/private-file-1", isMine: true }],
            activity: [], allowedActions: { attachFirstVersion: false, upload: true, share: true, signedCopy: false, recordSigning: false },
        }];
        mocks.share.mockReset().mockRejectedValueOnce(new Error("Response lost")).mockResolvedValue({ contractId: "contract-1", versionId: "version-1", revision: 2 });
        const { rerender } = render(<ContractHub role="district" />);
        await user.click(screen.getByRole("button", { name: "Share version 1" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Response lost");
        const first = mocks.share.mock.calls[0][0];

        mocks.agreements = [{ ...mocks.agreements[0], revision: 2 }];
        rerender(<ContractHub role="district" />);
        await user.click(screen.getByRole("button", { name: "Share version 1" }));
        await waitFor(() => expect(mocks.share).toHaveBeenCalledTimes(2));
        expect(mocks.share.mock.calls[1][0]).toEqual(first);
    });

    it("retains a stale revision file and starts a refreshed immutable mutation", async () => {
        const user = userEvent.setup();
        mocks.agreements = [{
            contractId: "contract-1", title: "Stale agreement", revision: 1, status: "draft",
            currentVersionState: "none", legacy: false,
            versions: [{ versionId: "version-1", privateFileId: "private-file-1", number: 1, kind: "original", fileName: "scope.pdf", uploaderName: "Dana District", createdAt: Date.now(), coordinationState: "draft", downloadUrl: "/api/private-files/private-file-1", isMine: true }],
            activity: [], allowedActions: { attachFirstVersion: false, upload: true, share: true, signedCopy: false, recordSigning: false },
        }];
        mocks.saveVersion.mockReset().mockRejectedValueOnce(new Error("Record changed; refresh and try again")).mockResolvedValue({ contractId: "contract-1", versionId: "version-2", revision: 3 });
        const { rerender } = render(<ContractHub role="district" />);
        const file = new File(["revision"], "retained-revision.pdf", { type: "application/pdf" });
        await user.upload(screen.getByLabelText("Upload a revision"), file);
        await user.click(screen.getByRole("button", { name: "Save private version" }));
        expect(await screen.findByRole("alert")).toHaveTextContent(/record changed/i);
        expect(screen.getByText(file.name)).toBeInTheDocument();
        const first = mocks.saveVersion.mock.calls[0][0];

        mocks.agreements = [{ ...mocks.agreements[0], revision: 2 }];
        rerender(<ContractHub role="district" />);
        await user.click(screen.getByRole("button", { name: "Retry with latest revision" }));
        await waitFor(() => expect(mocks.saveVersion).toHaveBeenCalledTimes(2));
        expect(mocks.saveVersion.mock.calls[1][0].expectedRevision).toBe(2);
        expect(mocks.saveVersion.mock.calls[1][0].requestId).not.toBe(first.requestId);
    });

    it("offers Share only for the latest private draft and labels retained history", () => {
        mocks.agreements = [{
            contractId: "contract-1", title: "Versioned agreement", revision: 5, status: "draft",
            currentSharedVersionId: "version-1", currentVersionState: "shared", legacy: false,
            versions: [
                { versionId: "version-3", privateFileId: "private-file-3", number: 3, kind: "revision", fileName: "v3.pdf", uploaderName: "Dana District", createdAt: 3, coordinationState: "draft", downloadUrl: "/api/private-files/private-file-3", isMine: true },
                { versionId: "version-2", privateFileId: "private-file-2", number: 2, kind: "revision", fileName: "v2.pdf", uploaderName: "Dana District", createdAt: 2, coordinationState: "draft", downloadUrl: "/api/private-files/private-file-2", isMine: true },
                { versionId: "version-1", privateFileId: "private-file-1", number: 1, kind: "original", fileName: "v1.pdf", uploaderName: "Dana District", createdAt: 1, sharedAt: 1, coordinationState: "shared", downloadUrl: "/api/private-files/private-file-1", isMine: true },
            ],
            activity: [], allowedActions: { attachFirstVersion: false, upload: true, share: true, signedCopy: true, recordSigning: true },
        }];
        render(<ContractHub role="district" />);
        expect(screen.getByRole("button", { name: "Share version 3" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Share version 2" })).not.toBeInTheDocument();
        expect(screen.getByText("Latest private draft")).toBeInTheDocument();
        expect(screen.getByText("Current shared version")).toBeInTheDocument();
        expect(screen.getByText("Earlier version")).toBeInTheDocument();
    });

    it("directs ineligible legacy content to migration instead of first-version attachment", () => {
        mocks.agreements = [{
            contractId: "legacy-1", title: "Legacy agreement", revision: 0, status: "draft",
            currentVersionState: "none", legacy: true, versions: [], activity: [],
            allowedActions: { attachFirstVersion: false, upload: false, share: false, signedCopy: false, recordSigning: false },
        }];
        render(<ContractHub role="district" />);
        expect(screen.getByText(/requires guarded migration/i)).toBeInTheDocument();
        expect(screen.queryByLabelText("Attach first agreement file")).not.toBeInTheDocument();
    });

    it("disables version file replacement while its upload is pending", async () => {
        const user = userEvent.setup();
        let releaseUpload!: (value: { privateFileId: string }) => void;
        mocks.uploadPrivateFile.mockReturnValueOnce(new Promise((resolve) => { releaseUpload = resolve; }));
        mocks.agreements = [{
            contractId: "contract-1", title: "Pending agreement", revision: 1, status: "draft",
            currentVersionState: "none", legacy: false,
            versions: [{ versionId: "version-1", privateFileId: "private-file-1", number: 1, kind: "original", fileName: "v1.pdf", uploaderName: "Dana District", createdAt: 1, coordinationState: "draft", downloadUrl: "/api/private-files/private-file-1", isMine: true }],
            activity: [], allowedActions: { attachFirstVersion: false, upload: true, share: true, signedCopy: false, recordSigning: false },
        }];
        render(<ContractHub role="district" />);
        const selector = screen.getByLabelText("Upload a revision");
        await user.upload(selector, new File(["revision"], "pending.pdf", { type: "application/pdf" }));
        await user.click(screen.getByRole("button", { name: "Save private version" }));
        expect(selector).toBeDisabled();
        releaseUpload({ privateFileId: "private-file-2" });
        await waitFor(() => expect(mocks.saveVersion).toHaveBeenCalled());
    });
});
