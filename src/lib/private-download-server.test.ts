// @vitest-environment node
import { it, expect, vi, afterEach } from "vitest";
const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
import { streamPrivateDownload } from "./private-download-server";
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it("streams above 4.5 MB without buffering and forwards a fresh authenticated PDF view request", async () => {
 vi.stubEnv("NEXT_PUBLIC_CONVEX_SITE_URL", "https://test.convex.site");
 const getToken = vi.fn(async () => "synthetic-test-jwt"); authMock.mockResolvedValue({ userId: "synthetic-user", getToken });
 const bytes = new Uint8Array(5 * 1024 * 1024); bytes[0] = 123;
 const upstream = new Response(new Blob([bytes]).stream(), { headers: { "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=test.pdf" } });
 const bufferRead = vi.spyOn(upstream, "arrayBuffer"); const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(upstream);
 const response = await streamPrivateDownload({ fileId: "synthetic-file" }, true);
 expect(response.body).toBe(upstream.body); expect(bufferRead).not.toHaveBeenCalled();
 expect(Buffer.from(await response.arrayBuffer()).equals(Buffer.from(bytes))).toBe(true);
 expect(response.headers.get("cache-control")).toBe("private, no-store");
 expect(fetchMock).toHaveBeenCalledWith("https://test.convex.site/private-files/download?fileId=synthetic-file&view=1", { headers: { Authorization: "Bearer synthetic-test-jwt" }, cache: "no-store" });
 expect(getToken).toHaveBeenCalledWith({ template: "convex" });
});
it("does not request bytes when the current session is missing", async () => {
 authMock.mockResolvedValue({ userId: null }); const fetchMock = vi.spyOn(globalThis, "fetch");
 expect((await streamPrivateDownload({ fileId: "private" })).status).toBe(401); expect(fetchMock).not.toHaveBeenCalled();
});
