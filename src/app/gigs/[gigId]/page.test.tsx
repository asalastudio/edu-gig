import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GigCheckoutPage from "./page";

vi.mock("next/link", () => ({
    default: ({
        children,
        href,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("next/navigation", () => ({
    useParams: () => ({ gigId: "sample-gig-123" }),
}));

vi.mock("convex/react", () => ({
    useQuery: () => null,
}));

vi.mock("@/convex/_generated/api", () => ({
    api: {
        gigs: {
            getById: {},
        },
    },
}));

vi.mock("@/components/shared/site-header", () => ({
    SiteHeader: () => <header>K12Gig</header>,
}));

vi.mock("@/components/shared/site-footer", () => ({
    SiteFooter: () => <footer>K12Gig footer</footer>,
}));

describe("GigCheckoutPage", () => {
    afterEach(() => {
        cleanup();
    });

    it("explains that checkout is not part of K12Gig", () => {
        render(<GigCheckoutPage />);

        expect(screen.getByRole("heading", { name: /Checkout is not part of K12Gig/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /Post a need/i })).toBeInTheDocument();
        expect(screen.queryByText(/Pay with Stripe/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText("Desired Start Date")).not.toBeInTheDocument();
    });
});
