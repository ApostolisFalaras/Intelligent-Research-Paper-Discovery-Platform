import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ToggleItem from "../../../src/components/search/ToggleItem.jsx";


describe("ToggleItem", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders its labels", () => {
		render(
			<ToggleItem 
				label="Open access only"
				checked={false}
				onChange={() => {}}
			/>
		);

		expect(screen.getByText("Open access only")).toBeInTheDocument();
	});


	it("Renders the sublabel when provided", () => {
		render(
			<ToggleItem 
				label="Open access only"
				sublabel="Default on"
				checked={true}
				onChange={() => {}}
			/>
		);

		expect(screen.getByText("Default on")).toBeInTheDocument();
	});


	it("Doesn't render the sublabel when one is not provided", () => {
		render(
            <ToggleItem
                label="PDF Available"
                checked={false}
                onChange={() => {}}
            />
        );

        expect(screen.queryByText("Default on")).not.toBeInTheDocument();
	});


	it("applies checked classes when checked is true", () => {
        const { container } = render(
            <ToggleItem
                label="Open access only"
                checked={true}
                onChange={() => {}}
            />
        );

        expect(container.querySelector(".toggle-switch-container")).toHaveClass("checked");
        expect(container.querySelector(".toggle-switch")).toHaveClass("checked");
    });


	it("does not apply checked classes when checked is false", () => {
        const { container } = render(
            <ToggleItem
                label="Open access only"
                checked={false}
                onChange={() => {}}
            />
        );

        expect(container.querySelector(".toggle-switch-container")).not.toHaveClass("checked");
        expect(container.querySelector(".toggle-switch")).not.toHaveClass("checked");
    });


	// ---------- USER INTERACTION TESTS ----------

	it("Calls onChange with true when an unchecked toggle is clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		const { container } = render(
            <ToggleItem
                label="Open access only"
                checked={false}
                onChange={onChange}
            />
        );

		await user.click(container.querySelector(".toggle-switch-container"));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
	});


	it("Calls onChange with false when a checked toggle is clicked", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        const { container } = render(
            <ToggleItem
                label="Open access only"
                checked={true}
                onChange={onChange}
            />
        );

        await user.click(container.querySelector(".toggle-switch-container"));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(false);
    });
});