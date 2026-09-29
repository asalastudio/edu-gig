import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PublicProfileAvailability } from "./public-profile-availability";

describe("PublicProfileAvailability", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows open-to-clients status near the top without Available now", () => {
        render(<PublicProfileAvailability status="open" />);

        expect(screen.getByTestId("profile-availability")).toBeInTheDocument();
        expect(screen.getByText("Availability")).toBeInTheDocument();
        expect(screen.getByText("Open to New Clients")).toBeInTheDocument();
        expect(screen.queryByText(/available now/i)).not.toBeInTheDocument();
    });
});
