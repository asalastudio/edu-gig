import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gig details" };

export default function GigDetailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
