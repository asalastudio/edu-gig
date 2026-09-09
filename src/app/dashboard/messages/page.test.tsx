import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getFunctionName } from "convex/server";

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));
vi.mock("convex/react", () => ({
    useMutation: () => vi.fn().mockResolvedValue(undefined),
    useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name === "users:viewer") return { _id: "district-user", role: "district" };
        if (name === "messages:listMyConversations") return [{
            conversationId: "consultant-user:district-user",
            counterpartId: "consultant-user",
            counterpartEducatorId: "educator-doc-b",
            counterpartName: "Consultant B",
            lastMessage: "Are you available?",
            lastAt: 1,
            unread: 0,
        }];
        if (name === "messages:listConversation") return [{
            _id: "message-1",
            senderId: "district-user",
            recipientId: "consultant-user",
            content: "Are you available?",
            read: true,
            createdAt: 1,
        }];
        if (name === "engagements:listMine") return [];
        return undefined;
    },
}));
vi.mock("@/components/shared/sidebar", () => ({ Sidebar: () => null }));

import MessagesPage from "./page";

describe("message handoff without URL context", () => {
    afterEach(() => cleanup());

    it("links an existing consultant conversation to a contextual post using the educator document ID", () => {
        HTMLElement.prototype.scrollIntoView = vi.fn();
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test";
        render(<MessagesPage />);

        expect(screen.getByRole("link", { name: "Post a need for Consultant B" })).toHaveAttribute(
            "href",
            "/post?educator=educator-doc-b&name=Consultant%20B"
        );
    });
});
