import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CredentialsSection } from "./credentials-section";

vi.hoisted(() => { delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY; });

vi.mock("convex/react", () => ({
    useMutation: () => vi.fn(),
    useQuery: () => null,
}));
vi.mock("@clerk/nextjs", () => ({ useAuth: () => { throw new Error("useAuth must remain behind the Clerk provider guard"); } }));

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
        privateFiles: {
            requestUpload: {},
        },
    },
}));

describe("CredentialsSection", () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it("defers Checkr by default for the controlled beta", () => {
        vi.stubEnv("NEXT_PUBLIC_ENABLE_CHECKR", "");
        render(<CredentialsSection />);

        expect(screen.getByText(/background checks are deferred/i)).toBeInTheDocument();
        expect(screen.queryAllByText("Verified")).toHaveLength(0);
        expect(screen.queryByText("Standard Teaching Certificate")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /start background check/i })).not.toBeInTheDocument();
    });
});
