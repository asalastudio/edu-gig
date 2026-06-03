import React from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";

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

vi.mock("convex/react", () => ({
    useQuery: () => null,
}));

vi.mock("@/convex/_generated/api", () => ({
    api: {
        users: {
            viewer: {},
        },
    },
}));

vi.mock("@clerk/nextjs", () => ({
    UserButton: () => <button type="button">User menu</button>,
}));

vi.mock("next-themes", () => ({
    useTheme: () => ({
        theme: "light",
        setTheme: vi.fn(),
    }),
}));

describe("SiteHeader", () => {
    beforeEach(() => {
        vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
            callback(0);
            return 1;
        });
        vi.stubGlobal("cancelAnimationFrame", vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("does not render dark-mode toggle controls", async () => {
        render(<SiteHeader />);

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.queryAllByRole("button", { name: /toggle theme/i })).toHaveLength(0);
    });
});
