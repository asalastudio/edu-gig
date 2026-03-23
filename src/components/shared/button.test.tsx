import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrimaryButton } from "./button";

describe("PrimaryButton", () => {
    it("renders children", () => {
        render(<PrimaryButton>Save changes</PrimaryButton>);
        expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
    });

    it("calls onClick when clicked", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();
        render(<PrimaryButton onClick={onClick}>Go</PrimaryButton>);
        await user.click(screen.getByRole("button", { name: /go/i }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
