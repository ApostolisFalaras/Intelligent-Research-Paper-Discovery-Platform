import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DeleteModal from "../../../src/components/profile/DeleteModal.jsx";

// Minimal mock user profile data
const mockProfileInfo = {
    totalSavedPapers: 24,
    totalFolders: 5,
    authorsFollowed: [ { id: "A1" }, { id: "A2" }, { id: "A3" } ]
};


describe("DeleteModal", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the account data that will be deleted", () => {
        render(
            <DeleteModal
                onClose={vi.fn()}
                onDelete={vi.fn()}
                profileInfo={mockProfileInfo}
            />
        );

        expect(screen.getByText(/24 saved papers/)).toBeInTheDocument();
        expect(screen.getByText(/5 collections/)).toBeInTheDocument();
        expect(screen.getByText(/3 followed authors/)).toBeInTheDocument();
    });


	it("Disables account deletion by default", () => {
        render(
            <DeleteModal
                onClose={vi.fn()}
                onDelete={vi.fn()}
                profileInfo={mockProfileInfo}
            />
        );

        expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled();
    });


	// ---------- USER INTERACTIONS TESTS ----------

	it("Keeps account deletion disabled when the confirmation text does not match", async () => {
        const user = userEvent.setup();

        render(
            <DeleteModal
                onClose={vi.fn()}
                onDelete={vi.fn()}
                profileInfo={mockProfileInfo}
            />
        );

        await user.type(screen.getByPlaceholderText("delete my account"), "delete account");

        expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled();
    });


	it("Enables account deletion when the exact confirmation text is entered", async () => {
        const user = userEvent.setup();

        render(
            <DeleteModal
                onClose={vi.fn()}
                onDelete={vi.fn()}
                profileInfo={mockProfileInfo}
            />
        );

        await user.type(screen.getByPlaceholderText("delete my account"), "delete my account");

        expect(screen.getByRole("button", { name: "Delete account" })).toBeEnabled();
    });


	it("Keeps account deletion disabled when the confirmation has different capitalization", async () => {
        const user = userEvent.setup();

        render(
            <DeleteModal
                onClose={vi.fn()}
                onDelete={vi.fn()}
                profileInfo={mockProfileInfo}
            />
        );

        await user.type(screen.getByPlaceholderText("delete my account"), "Delete My Account");
        expect(screen.getByRole("button", { name: "Delete account" })).toBeDisabled();
    });


	it("Calls onDelete when account deletion is confirmed", async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn();

        render(
            <DeleteModal
                onClose={vi.fn()}
                onDelete={onDelete}
                profileInfo={mockProfileInfo}
            />
        );

        await user.type(screen.getByPlaceholderText("delete my account"), "delete my account");

        await user.click(screen.getByRole("button", { name: "Delete account" }));

        expect(onDelete).toHaveBeenCalledTimes(1);
    });


	it("Calls onClose when Cancel is clicked", async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();

        render(
            <DeleteModal
                onClose={onClose}
                onDelete={vi.fn()}
                profileInfo={mockProfileInfo}
            />
        );

        await user.click(screen.getByRole("button", { name: "Cancel" }));
		
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});