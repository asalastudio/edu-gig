import { RoleGuard } from "@/components/shared/role-guard";

export default function DistrictDashboardLayout({ children }: { children: React.ReactNode }) {
    return <RoleGuard expected="district">{children}</RoleGuard>;
}
