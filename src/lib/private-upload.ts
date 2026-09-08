import type { Id } from "../../convex/_generated/dataModel";
/** Direct browser-to-Convex upload avoids the hosting provider's buffered body cap. */
export async function uploadPrivateFile(args: { file: File; ticketId: Id<"uploadTickets">; token: string; signal?: AbortSignal }): Promise<{ privateFileId: Id<"privateFiles"> }> {
 const origin = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
 if (!origin) throw new Error("Private upload service unavailable");
 const response = await fetch(`${origin}/private-files/upload`, { method: "POST", headers: { Authorization: `Bearer ${args.token}`, "Content-Type": args.file.type, "X-Upload-Ticket": args.ticketId }, body: args.file, signal: args.signal });
 const result = await response.json(); if (!response.ok) throw new Error(result.error || "Upload failed"); return result;
}
