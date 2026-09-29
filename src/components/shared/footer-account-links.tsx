"use client";

import Link from "next/link";
import { hasClerk, SIGNED_OUT_NAV, useAccountNav, type AccountNav } from "./use-account-nav";

const linkClass = "text-sm text-white/70 hover:text-white";

/** The footer links that depend on who is signed in: gig link and Sign in / Dashboard. */
export function FooterAccountLinks({ slot }: { slot: "gig" | "account" }) {
    if (!hasClerk) return <FooterAccountLinksView nav={SIGNED_OUT_NAV} slot={slot} />;
    return <FooterAccountLinksWithClerk slot={slot} />;
}

function FooterAccountLinksWithClerk({ slot }: { slot: "gig" | "account" }) {
    return <FooterAccountLinksView nav={useAccountNav()} slot={slot} />;
}

function FooterAccountLinksView({ nav, slot }: { nav: AccountNav; slot: "gig" | "account" }) {
    if (slot === "gig") {
        return nav.isConsultant ? (
            <Link href="/dashboard/board" className={linkClass}>Gig Board</Link>
        ) : (
            <Link href="/post" className={linkClass}>Post a gig</Link>
        );
    }
    if (nav.loading) return null;
    return nav.signedIn ? (
        <Link href={nav.dashboardHref} className="text-sm text-white/80 hover:text-white font-semibold">
            {nav.dashboardLabel}
        </Link>
    ) : (
        <Link href="/login" className="text-sm text-white/80 hover:text-white font-semibold">Sign in</Link>
    );
}
