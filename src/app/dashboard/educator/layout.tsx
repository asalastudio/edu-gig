import type { Metadata } from "next";
import { RoleGuard } from "@/components/shared/role-guard";

export const metadata: Metadata = { title: { default: "Consultant dashboard", template: "%s | K12Gig" } };

export default function EducatorDashboardLayout({ children }: { children: React.ReactNode }) {
    return <RoleGuard expected="educator">{children}</RoleGuard>;
}
