import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    afterEach(cleanup);

    it("hides Stripe card checkout by default for invoice-only beta", () => {
        render(<GigCheckoutPage />);

        expect(screen.getByText(/Purchase order \/ Net-30 invoice/i)).toBeInTheDocument();
        expect(screen.getByText(/Card payments are not yet available/i)).toBeInTheDocument();
        expect(screen.queryByText(/Credit Card/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Pay with Stripe/i)).not.toBeInTheDocument();
    });

    it("labels checkout inputs and associates the required-date error", () => {
        render(<GigCheckoutPage />);

        const startDate = screen.getByLabelText("Desired Start Date");
        expect(screen.getByLabelText("Purchase Order (PO) Number")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Submit booking request/i }));

        const error = screen.getByRole("alert");
        expect(error).toHaveTextContent(/choose a desired start date/i);
        expect(startDate).toHaveAttribute("aria-invalid", "true");
        expect(startDate).toHaveAttribute("aria-describedby", error.id);
    });
});
