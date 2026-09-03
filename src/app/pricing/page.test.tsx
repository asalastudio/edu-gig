import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PricingPage from "./page";

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

vi.mock("@/components/shared/site-header", () => ({
    SiteHeader: () => <header>K12Gig</header>,
}));

vi.mock("@/components/shared/site-footer", () => ({
    SiteFooter: () => <footer>K12Gig footer</footer>,
}));

describe("PricingPage", () => {
    it("describes off-platform payment and Contract Hub instead of checkout fees", () => {
        render(<PricingPage />);

        expect(screen.getByText(/Payment stays between you/i)).toBeInTheDocument();
        expect(screen.getByText(/does not charge an 18% fee/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Contract Hub/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/card checkout via stripe today/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Educators are paid weekly via ACH/i)).not.toBeInTheDocument();
    });
});
