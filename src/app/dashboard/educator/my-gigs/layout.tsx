import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Gigs" };

export default function MyGigsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
