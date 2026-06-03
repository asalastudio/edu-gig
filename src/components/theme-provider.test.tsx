import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "./theme-provider";

const nextThemes = vi.hoisted(() => ({
    ThemeProvider: vi.fn(({ children }: { children: React.ReactNode }) => children),
}));

vi.mock("next-themes", () => ({
    ThemeProvider: nextThemes.ThemeProvider,
}));

describe("ThemeProvider", () => {
    beforeEach(() => {
        nextThemes.ThemeProvider.mockClear();
    });

    it("forces the app to render in light mode", () => {
        render(
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem forcedTheme="dark">
                <span>Content</span>
            </ThemeProvider>
        );

        expect(screen.getByText("Content")).toBeInTheDocument();

        const props = nextThemes.ThemeProvider.mock.calls[0]?.[0];
        expect(props).toEqual(
            expect.objectContaining({
                attribute: "class",
                defaultTheme: "light",
                enableSystem: false,
                forcedTheme: "light",
            })
        );
    });
});
