import type { Metadata } from "next";

export const metadata: Metadata = { title: "Post a gig" };

export default function PostGigLayout({ children }: { children: React.ReactNode }) {
    return children;
}
