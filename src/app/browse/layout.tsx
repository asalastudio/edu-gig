import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Find consultants", template: "%s | K12Gig" } };

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
    return children;
}
