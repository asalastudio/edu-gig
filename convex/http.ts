import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { decryptFile, encryptFile, MAX_PRIVATE_FILE_BYTES, validateFile } from "./lib/privateCrypto";
import { getAppIdentity } from "./lib/staging";
const router = httpRouter();
function cors(request: Request) {
 const allowed = process.env.NEXT_PUBLIC_APP_URL;
 const origin = request.headers.get("Origin");
 if (!allowed || new URL(allowed).origin !== allowed || (origin && origin !== allowed)) throw new Error("Forbidden origin");
 return { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Upload-Ticket", "Access-Control-Expose-Headers": "Content-Disposition", Vary: "Origin", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
}
async function boundedBody(request: Request) {
 const size = Number(request.headers.get("Content-Length") ?? 0);
 if (size > MAX_PRIVATE_FILE_BYTES) throw new Error("File too large");
 if (!request.body) throw new Error("Empty body");
 const reader = request.body.getReader(); const chunks = []; let total = 0;
 for (;;) { const { done, value } = await reader.read(); if (done) break; total += value.length; if (total > MAX_PRIVATE_FILE_BYTES) { await reader.cancel(); throw new Error("File too large"); } chunks.push(value); }
 const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; } return bytes;
}
const preflight = httpAction(async (_ctx, request) => {
 try { return new Response(null, { status: 204, headers: cors(request) }); } catch { return new Response("Forbidden", { status: 403 }); }
});
router.route({ path: "/private-files/upload", method: "OPTIONS", handler: preflight });
router.route({ path: "/private-files/download", method: "OPTIONS", handler: preflight });
router.route({ path: "/private-files/upload", method: "POST", handler: httpAction(async (ctx, request) => {
 let headers: Record<string, string>;
 try { headers = cors(request); if (!await getAppIdentity(ctx)) return new Response("Authentication required", { status: 401, headers }); }
 catch { return new Response("Forbidden", { status: 403 }); }
 let stored: Id<"_storage"> | undefined;
 try {
  const ticketId = request.headers.get("X-Upload-Ticket") as Id<"uploadTickets">;
  if (!ticketId) throw new Error("Upload ticket required");
  const ticket = await ctx.runQuery(api.privateFiles.uploadTicket, { ticketId });
  if (request.headers.get("Content-Type")?.split(";")[0] !== ticket.mimeType) throw new Error("File type mismatch");
  const bytes = await boundedBody(request); validateFile(bytes, ticket);
  const encrypted = await encryptFile(bytes);
  stored = await ctx.storage.store(new Blob([encrypted.ciphertext], { type: "application/octet-stream" }));
  const result = await ctx.runMutation(internal.privateFiles.finalizeOwnedUpload, { ticketId, storageId: stored, sha256: encrypted.sha256, nonce: encrypted.nonce, keyId: encrypted.keyId, size: bytes.length });
  return Response.json(result, { headers });
 } catch (error) {
  if (stored) await ctx.storage.delete(stored);
  const message = error instanceof Error ? error.message : "Upload failed";
  return Response.json({ error: message.includes("Forbidden") ? "Forbidden" : message.slice(0, 180) }, { status: message.includes("Forbidden") ? 403 : 400, headers });
 }
}) });
router.route({ path: "/private-files/download", method: "GET", handler: httpAction(async (ctx, request) => {
 let headers: Record<string, string>;
 try { headers = cors(request); if (!await getAppIdentity(ctx)) return new Response("Authentication required", { status: 401, headers }); }
 catch { return new Response("Forbidden", { status: 403 }); }
 try {
  const url = new URL(request.url);
  const proposalId = url.searchParams.get("proposalId") as Id<"proposals"> | null;
  const file = proposalId ? await ctx.runQuery(api.privateFiles.proposalDownloadDescriptor, { proposalId }) : await ctx.runQuery(api.privateFiles.downloadDescriptor, { privateFileId: url.searchParams.get("fileId") as Id<"privateFiles"> });
  const blob = await ctx.storage.get(file.storageId); if (!blob) throw new Error("Unavailable");
  const bytes = await decryptFile(new Uint8Array(await blob.arrayBuffer()), file);
  if (bytes.length !== file.size) throw new Error("Integrity failure");
  return new Response(new Blob([bytes], { type: file.mimeType }).stream(), { headers: { ...headers, "Content-Type": file.mimeType, "Content-Disposition": `${url.searchParams.get("view") === "1" && file.mimeType === "application/pdf" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`, "Content-Length": String(bytes.length), "Content-Security-Policy": "sandbox" } });
 } catch { return new Response("File unavailable or access denied", { status: 403, headers }); }
}) });
export default router;
