import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SaveButton from "../../../src/components/profile/SaveButton.jsx";


describe("SaveButton", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays Save changes by default", () => {
        render(
            <SaveButton
                onClick={vi.fn()}
                saved={false}
                loading={false}
            />
        );

        expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    });


	it("Displays Saving and disables the button while loading", () => {
        render(
            <SaveButton
                onClick={vi.fn()}
                saved={false}
                loading={true}
            />
        );

        const button = screen.getByRole("button", { name: "Saving..." });
        expect(button).toBeDisabled();
    });


	it("Displays Saved after changes have been saved", () => {
        render(
            <SaveButton
                onClick={vi.fn()}
                saved={true}
                loading={false}
            />
        );

        expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
    });


	it("Calls onClick when the button is clicked", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <SaveButton
                onClick={onClick}
                saved={false}
                loading={false}
            />
        );

        await user.click(screen.getByRole("button", { name: "Save changes" }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });


	it("Does not call onClick while loading", async () => {
        const user = userEvent.setup();
        const onClick = vi.fn();

        render(
            <SaveButton
                onClick={onClick}
                saved={false}
                loading={true}
            />
        );

        await user.click(screen.getByRole("button", { name: "Saving..." }));

        expect(onClick).not.toHaveBeenCalled();
    });
});