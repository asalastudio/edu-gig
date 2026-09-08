import type { Id } from "../../convex/_generated/dataModel";

const MIME_BY_EXTENSION: Record<string, string> = {
 pdf: "application/pdf",
 doc: "application/msword",
 docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 png: "image/png",
 jpg: "image/jpeg",
 jpeg: "image/jpeg",
};

export function privateFileMime(file: File) {
 if (file.type) return file.type;
 const extension = file.name.toLowerCase().split(".").pop() ?? "";
 return MIME_BY_EXTENSION[extension] ?? "application/octet-stream";
}
/** Direct browser-to-Convex upload avoids the hosting provider's buffered body cap. */
export async function uploadPrivateFile(args: { file: File; ticketId: Id<"uploadTickets">; token: string; signal?: AbortSignal }): Promise<{ privateFileId: Id<"privateFiles"> }> {
 const origin = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
 if (!origin) throw new Error("Private upload service unavailable");
 const response = await fetch(`${origin}/private-files/upload`, { method: "POST", headers: { Authorization: `Bearer ${args.token}`, "Content-Type": privateFileMime(args.file), "X-Upload-Ticket": args.ticketId }, body: args.file, signal: args.signal });
 const result = await response.json(); if (!response.ok) throw new Error(result.error || "Upload failed"); return result;
}
