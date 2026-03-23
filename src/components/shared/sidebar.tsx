"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SquaresFour, Users, Clock, EnvelopeSimple, Gear, Briefcase, PlusCircle } from "@phosphor-icons/react";

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

    const navItems: NavItem[] = [
        { href: basePath, label: "Dashboard", icon: SquaresFour },
        { href: "/browse", label: "Directory", icon: Users },
        { href: isEducator ? "/dashboard/educator" : "/post", label: isEducator ? "My Gigs" : "Create Request", icon: isEducator ? Briefcase : PlusCircle },
        { href: "#", label: "Messages", icon: EnvelopeSimple, count: 3 },
        { href: "#", label: "Settings", icon: Gear },
    ];

    return (
        <aside className="w-[220px] h-screen flex flex-col bg-[--bg-subtle] border-r border-[--border-default] px-2 py-4">

            {/* Logo */}
            <div className="px-3 mb-6">
                <Link href="/">
                    <span className="font-heading text-lg font-bold text-[--text-primary]">
                        EduGig
                    </span>
                </Link>
            </div>

            {/* Nav Group */}
            <nav className="flex flex-col gap-0.5">
                <span className="px-3 mb-1 text-[10px] font-semibold text-[--text-tertiary] uppercase tracking-widest">
                    Workspace
                </span>
                {navItems.map(item => (
                    <SidebarItem key={item.label} item={item} />
                ))}
            </nav>

        </aside>
    )
}

function SidebarItem({ item }: { item: NavItem }) {
    const pathname = usePathname()
    // Exact match for active state, or prefix match for subpages
    const isActive = item.href !== "#" && (pathname === item.href || (item.href !== "/browse" && item.href !== "/post" && pathname.startsWith(item.href)));
    
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
            {item.count && (
                <span className="ml-auto text-xs text-[--text-tertiary] font-mono">
                    {item.count}
                </span>
            )}
        </Link>
    )
}
