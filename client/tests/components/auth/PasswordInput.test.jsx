import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PasswordInput from "../../../src/components/auth/PasswordInput.jsx";


describe("PasswordInput", () => {

	// ---------- RENDERING TESTS ----------

	it("Hides the password by default", () => {
		render(
			<PasswordInput 
				value="secret123"
				placeholder="Password"
				onChange={vi.fn()}
			/>
		);

		expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "password");
	});


	it("Toggles password visibility", async () => {
		render(
			<PasswordInput 
				value="secret123"
				placeholder="Password"
				onChange={vi.fn()}
			/>
		);

		const input = screen.getByPlaceholderText("Password");

		const button = screen.getByRole("button");

		await userEvent.click(button);
		expect(input).toHaveAttribute("type", "text");

		await userEvent.click(button);
		expect(input).toHaveAttribute("type", "password");
	});


	it("Returns the new password value", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <PasswordInput
                value=""
                placeholder="Password"
                onChange={onChange}
            />
        );

		const input = screen.getByPlaceholderText("Password");
        await user.type(input, "abc");

        expect(onChange).toHaveBeenLastCalledWith("c");
		expect(onChange).toHaveBeenCalledTimes(3);
    });


	it("Applies the error class", () => {
        const { container } = render(
            <PasswordInput
                value=""
                placeholder="Password"
                onChange={vi.fn()}
                hasError
            />
        );

        expect(container.querySelector(".password-container")).toHaveClass("has-error");
    });


	it("Applies and removes the focused class", () => {
        const { container } = render(
            <PasswordInput
                value=""
                placeholder="Password"
                onChange={vi.fn()}
            />
        );

        const input = screen.getByPlaceholderText("Password");

        const passwordContainer = container.querySelector(".password-container");

        fireEvent.focus(input);

        expect(passwordContainer).toHaveClass("focused");

        fireEvent.blur(input);

        expect(passwordContainer).not.toHaveClass("focused");
    });
});