import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TeamMembersEditor, type TeamMember } from "./team-members-editor";

const member: TeamMember = {
    name: "Alex Partner",
    title: "Co-presenter",
    bio: "Leads the literacy strand.",
};

describe("TeamMembersEditor", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the empty-state helper when there are no members", () => {
        render(<TeamMembersEditor value={[]} onChange={vi.fn()} />);
        expect(
            screen.getByText(/add partners or co-presenters/i)
        ).toBeInTheDocument();
    });

    it("adds a blank member row", async () => {
        const onChange = vi.fn();
        render(<TeamMembersEditor value={[]} onChange={onChange} />);

        await userEvent.click(screen.getByRole("button", { name: /add team member/i }));
        expect(onChange).toHaveBeenCalledWith([{ name: "", title: "", bio: "" }]);
    });

    it("edits a member field", async () => {
        const onChange = vi.fn();
        render(<TeamMembersEditor value={[member]} onChange={onChange} />);

        await userEvent.type(screen.getByDisplayValue("Alex Partner"), "!");
        expect(onChange).toHaveBeenLastCalledWith([
            { ...member, name: "Alex Partner!" },
        ]);
    });

    it("removes a member", async () => {
        const onChange = vi.fn();
        render(
            <TeamMembersEditor
                value={[member, { name: "Sam", title: "Ops", bio: "" }]}
                onChange={onChange}
            />
        );

        const removeButtons = screen.getAllByRole("button", { name: /remove/i });
        await userEvent.click(removeButtons[0]);
        expect(onChange).toHaveBeenCalledWith([{ name: "Sam", title: "Ops", bio: "" }]);
    });
});
