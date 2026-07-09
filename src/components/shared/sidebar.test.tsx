import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./sidebar";

const mocks = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("convex/react", () => ({ useQuery: mocks.useQuery }));
vi.mock("@/convex/_generated/api", () => ({
    api: {
        users: { viewer: "viewer-query" },
        messages: { unreadCount: "unread-query" },
    },
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/board" }));
vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>{children}</a>
    ),
}));
vi.mock("@clerk/nextjs", () => ({ UserButton: () => <span>User</span> }));

function renderForViewer(viewer: unknown) {
    mocks.useQuery.mockImplementation((query: string) => (query === "viewer-query" ? viewer : 0));
    return render(<Sidebar />);
}

describe("Sidebar", () => {
    afterEach(() => {
        cleanup();
        mocks.useQuery.mockReset();
    });

    it("labels the district board as Posted Needs", () => {
        renderForViewer({ role: "district_admin", email: "district@example.org" });

        expect(screen.getByRole("link", { name: /Posted Needs/i })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /Gig Board/i })).not.toBeInTheDocument();
    });

    it("keeps Gig Board language and exposes core destinations for educators", () => {
        renderForViewer({ role: "educator", email: "educator@example.org" });

        expect(screen.getByRole("link", { name: /Gig Board/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /My Gigs/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Earnings/i })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /Directory/i })).not.toBeInTheDocument();
    });

    it("renders a neutral workspace while role data is loading", () => {
        renderForViewer(undefined);

        expect(screen.getAllByText("Workspace").length).toBeGreaterThan(0);
        expect(screen.queryByRole("link", { name: /Directory|Posted Needs|Gig Board/i })).not.toBeInTheDocument();
    });
});
