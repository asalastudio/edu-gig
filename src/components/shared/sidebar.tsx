"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
    Briefcase,
    Buildings,
    ClipboardText,
    EnvelopeSimple,
    Gear,
    GraduationCap,
    PlusCircle,
    Receipt,
    ShieldCheck,
    SquaresFour,
    Users,
} from "@phosphor-icons/react";

export type NavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    count?: number;
};

export function Sidebar() {
    const pathname = usePathname();
    const viewer = useQuery(api.users.viewer, {});
    const isAdminWorkspace = pathname.includes('/dashboard/admin');
    const showAdminNav = isAdminWorkspace && viewer?.role === "superadmin";
    const isEducator = pathname.includes('/educator');
    const basePath = showAdminNav ? '/dashboard/admin' : isEducator ? '/dashboard/educator' : '/dashboard/district';
    const settingsHref = showAdminNav ? '' : isEducator ? '/dashboard/educator/settings' : '/dashboard/district/settings';

    const unread = useQuery(api.notifications.unreadCount, viewer ? {} : "skip");
    const messagesBadge = typeof unread === "number" ? unread : undefined;

    const navItems: NavItem[] = showAdminNav
        ? [
            { href: "/dashboard/admin", label: "Overview", icon: SquaresFour },
            { href: "/dashboard/admin/users", label: "Users", icon: Users },
            { href: "/dashboard/admin/districts", label: "Districts", icon: Buildings },
            { href: "/dashboard/admin/educators", label: "Educators", icon: GraduationCap },
            { href: "/dashboard/admin/orders", label: "Orders", icon: Receipt },
            { href: "/dashboard/admin/procurement", label: "Procurement", icon: ClipboardText },
            { href: "/dashboard/admin/verification", label: "Verification", icon: ShieldCheck },
        ]
        : [
            { href: basePath, label: "Dashboard", icon: SquaresFour },
            { href: "/browse", label: "Directory", icon: Users },
            { href: isEducator ? "/dashboard/educator/my-gigs" : "/post", label: isEducator ? "My Gigs" : "Create Request", icon: isEducator ? Briefcase : PlusCircle },
            { href: "/dashboard/messages", label: "Messages", icon: EnvelopeSimple, count: messagesBadge },
            { href: settingsHref, label: "Settings", icon: Gear },
        ];

    return (
        <aside className="w-[232px] h-screen flex flex-col bg-[#17261F] border-r border-[#2B4338] px-3 py-4 text-[var(--text-inverse)] shadow-[8px_0_28px_rgba(20,36,29,0.12)]">

            {/* Logo */}
            <div className="px-2 mb-7 flex flex-col gap-3">
                <Link href="/" aria-label="K12Gig home" className="w-fit">
                    <BrandLogo inverse className="[&>svg]:h-8 [&>svg]:w-8 [&>span]:text-xl" />
                </Link>
                <span
                    className="inline-flex w-fit items-center rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70"
                    title="Current workspace"
                >
                    {showAdminNav ? "Admin" : isEducator ? "Educator" : "District"}
                </span>
            </div>

            {/* Nav Group */}
            <nav className="flex flex-col gap-0.5">
                <span className="px-3 mb-2 text-[10px] font-semibold text-white/50 uppercase tracking-widest">
                    Workspace
                </span>
                {navItems.map(item => (
                    <SidebarItem key={item.label} item={item} basePath={basePath} settingsHref={settingsHref} />
                ))}
            </nav>

        </aside>
    )
}

function SidebarItem({
    item,
    basePath,
    settingsHref,
}: {
    item: NavItem;
    basePath: string;
    settingsHref: string;
}) {
    const pathname = usePathname();
    const isActive =
        item.href !== "#" &&
        (() => {
            if (item.href === "/dashboard/admin") return pathname === "/dashboard/admin";
            if (item.label === "Dashboard") return pathname === basePath;
            if (item.label === "Settings") return pathname.startsWith(settingsHref);
            if (item.href === "/browse") return pathname === "/browse" || pathname.startsWith("/browse/");
            if (item.href === "/post") return pathname.startsWith("/post");
            return pathname === item.href || pathname.startsWith(item.href + "/");
        })();
    
    return (
        <Link href={item.href}
            className={cn(
                "group flex items-center gap-2.5 px-3 py-1.5 rounded-md",
                "text-sm transition-colors duration-100",
                isActive
                    ? "bg-white text-[#17261F] font-bold border-l-2 border-[var(--accent-secondary)] pl-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.14)]"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
            )}>
            <item.icon weight={isActive ? "fill" : "regular"} className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-[var(--accent-primary)]" : "text-white/50 group-hover:text-white/80"
            )} />
            {item.label}
            {typeof item.count === "number" && item.count > 0 && (
                <span className="ml-auto text-xs font-mono opacity-70">
                    {item.count}
                </span>
            )}
        </Link>
    )
}
