import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CredentialsSection } from "./credentials-section";

vi.mock("convex/react", () => ({
    useMutation: () => vi.fn(),
    useQuery: () => null,
}));

vi.mock("@/convex/_generated/api", () => ({
    api: {
        credentials: {
            finalizeUpload: {},
            generateUploadUrl: {},
            listMine: {},
            remove: {},
        },
        educators: {
            getMine: {},
        },
        users: {
            viewer: {},
        },
    },
}));

describe("CredentialsSection", () => {
    it("defers Checkr by default for the controlled beta", () => {
        render(<CredentialsSection />);

        expect(screen.getByText(/background checks are deferred/i)).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /start background check/i })).not.toBeInTheDocument();
    });
});
