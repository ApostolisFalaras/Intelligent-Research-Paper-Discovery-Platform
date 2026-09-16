import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TextInput from "../../../src/components/auth/TextInput.jsx";


describe("TextInput", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders the supplied value and attributes", () => {
        render(
            <TextInput
                type="text"
                value="john"
                placeholder="Username"
                autoComplete="username"
                onChange={vi.fn()}
            />
        );

        const input = screen.getByPlaceholderText("Username");

        expect(input).toHaveValue("john");
        expect(input).toHaveAttribute("type", "text");
        expect(input).toHaveAttribute("autocomplete", "username");
    });


	it("Returns the new value when the input changes", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();

		render(
			<TextInput
                type="text"
                value=""
                placeholder="Username"
                autoComplete="username"
                onChange={onChange}
            />
		);

		const input = screen.getByPlaceholderText("Username");

		await user.type(input, "abc");
		
		expect(onChange).toHaveBeenLastCalledWith("c");
		expect(onChange).toHaveBeenCalledTimes(3);
	});


	it("Applies the error class when the input has an error", () => {
        render(
            <TextInput
                type="text"
                value=""
                placeholder="Username"
                onChange={vi.fn()}
                hasError
            />
        );

        expect(screen.getByPlaceholderText("Username")).toHaveClass("has-error");
    });


	it("Applies and removes the focused class", () => {
        render(
            <TextInput
                type="text"
                value=""
                placeholder="Username"
                onChange={vi.fn()}
            />
        );

        const input = screen.getByPlaceholderText("Username");

        fireEvent.focus(input);

        expect(input).toHaveClass("focused");

        fireEvent.blur(input);

        expect(input).not.toHaveClass("focused");
    });
});