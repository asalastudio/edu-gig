import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadPrivateFile } from "./private-upload";

describe("uploadPrivateFile", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it("infers the DOCX MIME type when the browser leaves File.type empty", async () => {
        vi.stubEnv("NEXT_PUBLIC_CONVEX_SITE_URL", "https://staging.example.test");
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ privateFileId: "private-1" }) });
        vi.stubGlobal("fetch", fetchMock);

        await uploadPrivateFile({
            file: new File(["docx bytes"], "proposal.docx", { type: "" }),
            ticketId: "ticket-1" as never,
            token: "jwt",
        });

        expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    });
});
