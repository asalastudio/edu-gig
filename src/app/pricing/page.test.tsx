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
    it("describes invoice-first controlled beta payment posture by default", () => {
        render(<PricingPage />);

        expect(screen.getByText(/invoice \/ PO-first/i)).toBeInTheDocument();
        expect(screen.queryByText(/card checkout via stripe today/i)).not.toBeInTheDocument();
    });
});
