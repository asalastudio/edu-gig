import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";

vi.hoisted(() => { process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test"; });

const mocks = vi.hoisted(() => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
    requestUpload: vi.fn(),
    uploadPrivateFile: vi.fn(),
    setResume: vi.fn(),
    clearResume: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({ useAuth: () => ({ getToken: mocks.getToken }) }));
vi.mock("@/lib/private-upload", () => ({ uploadPrivateFile: mocks.uploadPrivateFile, privateFileMime: (file: File) => file.type || "application/pdf" }));
vi.mock("convex/react", () => ({
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => getFunctionName(ref) === "educators:getMine" ? { _id: "educator-1" } : null,
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "privateFiles:requestUpload") return mocks.requestUpload;
        if (name === "educators:setResume") return mocks.setResume;
        return mocks.clearResume;
    },
}));

import { ResumeUpload } from "./resume-upload";

describe("ResumeUpload", () => {
    beforeEach(() => {
        mocks.requestUpload.mockReset().mockResolvedValue({ ticketId: "ticket-1" });
        mocks.uploadPrivateFile.mockReset().mockRejectedValueOnce(new Error("Connection interrupted")).mockResolvedValue({ privateFileId: "private-file-1" });
        mocks.setResume.mockReset();
        mocks.clearResume.mockReset();
    });
    afterEach(cleanup);

    it("keeps a failed file for retry and never attaches it without a private upload receipt", async () => {
        const user = userEvent.setup();
        const { container } = render(<ResumeUpload />);
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["resume"], "Jordan-Richter-Resume.pdf", { type: "application/pdf" });

        fireEvent.change(input, { target: { files: [file] } });

        expect(await screen.findByRole("alert")).toHaveTextContent("Connection interrupted");
        expect(mocks.setResume).not.toHaveBeenCalled();
        expect(screen.getByText(file.name)).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Retry upload" }));
        await waitFor(() => expect(mocks.setResume).toHaveBeenCalledWith({ privateFileId: "private-file-1", fileName: file.name }));
    });
});
