import { describe, expect, it, vi, afterEach } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "./copy-button";

function setClipboard(value: { writeText: (text: string) => Promise<void> } | undefined) {
    Object.defineProperty(navigator, "clipboard", { value, configurable: true });
}

function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
    setClipboard({ writeText });
    return writeText;
}

describe("CopyButton", () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it("copies the text and shows the copied state", async () => {
        const writeText = mockClipboard();
        render(<CopyButton text="Presenter bio for SCECH" label="Copy bio" />);

        expect(screen.getByRole("button", { name: /copy bio/i })).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button"));

        expect(writeText).toHaveBeenCalledWith("Presenter bio for SCECH");
        await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("Copied"));
    });

    it("reverts to the label after the copied window", async () => {
        vi.useFakeTimers();
        try {
            mockClipboard();
            render(<CopyButton text="hello" />);

            fireEvent.click(screen.getByRole("button"));
            await act(async () => {
                await Promise.resolve();
            });
            expect(screen.getByRole("button")).toHaveTextContent("Copied");

            await act(async () => {
                vi.advanceTimersByTime(2100);
            });
            expect(screen.getByRole("button")).toHaveTextContent("Copy");
        } finally {
            vi.useRealTimers();
        }
    });

    it("is a no-op when the clipboard API is unavailable", async () => {
        setClipboard(undefined);
        render(<CopyButton text="hello" />);

        fireEvent.click(screen.getByRole("button"));
        await act(async () => {
            await Promise.resolve();
        });
        expect(screen.getByRole("button")).toHaveTextContent("Copy");
    });
});
