import type { Metadata } from "next";
import { RoleGuard } from "@/components/shared/role-guard";

export const metadata: Metadata = { title: { default: "District dashboard", template: "%s | K12Gig" } };

export default function DistrictDashboardLayout({ children }: { children: React.ReactNode }) {
    return <RoleGuard expected="district">{children}</RoleGuard>;
}
