import { streamPrivateDownload } from "@/lib/private-download-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ fileId: string }> }) { return streamPrivateDownload(await context.params, new URL(request.url).searchParams.get("view") === "1"); }
