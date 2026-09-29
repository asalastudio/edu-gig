import type { Metadata } from "next";

export const metadata: Metadata = { title: "Consultant profile" };

export default function ConsultantProfileLayout({ children }: { children: React.ReactNode }) {
    return children;
}
