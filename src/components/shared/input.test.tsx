import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
    it("associates its label and announced error with the input", () => {
        render(
            <Input
                label="Desired Start Date"
                type="date"
                error="Please choose a desired start date."
            />
        );

        const input = screen.getByLabelText("Desired Start Date");
        const error = screen.getByRole("alert");
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(input).toHaveAttribute("aria-describedby", error.id);
    });
});
