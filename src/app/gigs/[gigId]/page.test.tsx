import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

vi.mock("convex/react", () => ({
    useMutation: () => vi.fn(),
    useQuery: () => null,
}));

vi.mock("@/convex/_generated/api", () => ({
    api: {
        gigs: {
            getById: {},
        },
        orders: {
            createFromGig: {},
        },
        users: {
            viewer: {},
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
    it("hides Stripe card checkout by default for invoice-only beta", () => {
        render(<GigCheckoutPage />);

        expect(screen.getByText(/ACH Bank Transfer/i)).toBeInTheDocument();
        expect(screen.queryByText(/Credit Card/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Pay with Stripe/i)).not.toBeInTheDocument();
    });
});
