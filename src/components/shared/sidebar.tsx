"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { SquaresFour, Users, EnvelopeSimple, Gear, Briefcase, PlusCircle } from "@phosphor-icons/react";

export type NavItem = {
    href: string;
    label: string;
    icon: React.ElementType;
    count?: number;
};

export function Sidebar() {
    const pathname = usePathname();
    const isEducator = pathname.includes('/educator');
    const basePath = isEducator ? '/dashboard/educator' : '/dashboard/district';
    const settingsHref = isEducator ? '/dashboard/educator/settings' : '/dashboard/district/settings';

    const viewer = useQuery(api.users.viewer, {});
    const unread = useQuery(api.notifications.unreadCount, viewer ? {} : "skip");
    const messagesBadge = typeof unread === "number" ? unread : undefined;

    const navItems: NavItem[] = [
        { href: basePath, label: "Dashboard", icon: SquaresFour },
        { href: "/browse", label: "Directory", icon: Users },
        { href: isEducator ? "/dashboard/educator/my-gigs" : "/post", label: isEducator ? "My Gigs" : "Create Request", icon: isEducator ? Briefcase : PlusCircle },
        { href: "/dashboard/messages", label: "Messages", icon: EnvelopeSimple, count: messagesBadge },
        { href: settingsHref, label: "Settings", icon: Gear },
    ];

    return (
        <aside className="w-[220px] h-screen flex flex-col bg-[--bg-subtle] border-r border-[--border-default] px-2 py-4">

            {/* Logo */}
            <div className="px-3 mb-6 flex flex-col gap-2">
                <Link href="/">
                    <span className="font-heading text-lg font-bold text-[--text-primary]">
                        EduGig
                    </span>
                </Link>
                <span
                    className="inline-flex w-fit items-center rounded-md border border-[--border-subtle] bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[--text-secondary]"
                    title="Current workspace"
                >
                    {isEducator ? "Educator" : "District"}
                </span>
            </div>

            {/* Nav Group */}
            <nav className="flex flex-col gap-0.5">
                <span className="px-3 mb-1 text-[10px] font-semibold text-[--text-tertiary] uppercase tracking-widest">
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
                    ? "bg-[--bg-hover] text-[--text-primary] font-medium border-l-2 border-[--accent-primary] pl-[10px]"
                    : "text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary]"
            )}>
            <item.icon weight={isActive ? "fill" : "regular"} className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-[--accent-primary]" : "text-[--text-tertiary] group-hover:text-[--text-secondary]"
            )} />
            {item.label}
            {typeof item.count === "number" && item.count > 0 && (
                <span className="ml-auto text-xs text-[--text-tertiary] font-mono">
                    {item.count}
                </span>
            )}
        </Link>
    )
}
