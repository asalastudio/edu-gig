import type { Metadata } from "next";

export const metadata: Metadata = { title: "District profile" };

export default function DistrictProfileLayout({ children }: { children: React.ReactNode }) {
    return children;
}
