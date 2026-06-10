import { RoleGuard } from "@/components/shared/role-guard";

export default function EducatorDashboardLayout({ children }: { children: React.ReactNode }) {
    return <RoleGuard expected="educator">{children}</RoleGuard>;
}
