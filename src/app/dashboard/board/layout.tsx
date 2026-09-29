import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Gigs", template: "%s | K12Gig" } };

export default function GigBoardLayout({ children }: { children: React.ReactNode }) {
    return children;
}
