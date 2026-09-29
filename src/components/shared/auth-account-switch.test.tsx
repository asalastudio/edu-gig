import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuthAccountSwitch } from "./auth-account-switch";

describe("AuthAccountSwitch", () => {
    afterEach(() => {
        cleanup();
    });

    it("keeps a single prominent sign-up path and forwards intent", () => {
        render(<AuthAccountSwitch mode="sign-up" href="/sign-up?intent=educator" />);

        expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
            "href",
            "/sign-up?intent=educator"
        );
        expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    });

    it("keeps a single sign-in path on the sign-up page and forwards intent", () => {
        render(<AuthAccountSwitch mode="sign-in" href="/sign-in?intent=district&next=%2Fpost" />);

        expect(screen.getByText("Already have an account?")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
            "href",
            "/sign-in?intent=district&next=%2Fpost"
        );
        expect(screen.queryByRole("link", { name: "Sign up" })).not.toBeInTheDocument();
    });
});
