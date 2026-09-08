import { auth } from "@clerk/nextjs/server";
/** Streams the upstream response; never materialize its body inside a Vercel Function. */
export async function streamPrivateDownload(params: { fileId: string } | { proposalId: string }, view = false) {
 const session = await auth(); if (!session.userId) return new Response("Authentication required", { status: 401 });
 const token = await session.getToken({ template: "convex" }); if (!token) return new Response("Authentication required", { status: 401 });
 const base = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
 if (!base || new URL(base).protocol !== "https:") return new Response("Private file service unavailable", { status: 503 });
 const query = new URLSearchParams(params);
 if (view) query.set("view", "1");
 const upstream = await fetch(`${base}/private-files/download?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
 const headers = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox" });
 for (const name of ["Content-Type", "Content-Length", "Content-Disposition"]) { const value = upstream.headers.get(name); if (value) headers.set(name, value); }
 return new Response(upstream.body, { status: upstream.status, headers });
}
