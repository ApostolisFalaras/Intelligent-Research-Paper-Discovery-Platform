import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import Field from "../../../src/components/auth/Field.jsx";


describe("Field", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders its label and child input", () => {
		render(
			<Field label="Username">
				<input placeholder="Username input" />
			</Field>
		);

		expect(screen.getByText("Username")).toBeInTheDocument();

		expect(screen.getByPlaceholderText("Username input")).toBeInTheDocument();
	});


	it("Shows the required indicator for required fields", () => {
		const { container } = render(
			<Field label="Username" required>
				<input placeholder="Username input" />
			</Field>
		);

		expect(container.querySelector(".required-asterisk")).toHaveTextContent("*");
	});


	it("Shows the hint when there's no error", () => {
		render(
			<Field label="Username" hint="3-20 characters">
				<input placeholder="Username input" />
			</Field>
		);

		expect(screen.getByText("3-20 characters")).toBeInTheDocument();
	});


	it("Shows the error instead of the hint", () => {
        render(
            <Field
                label="Username"
                hint="3-20 characters"
                error="Username is invalid."
            >
                <input />
            </Field>
        );

        expect(screen.getByText("Username is invalid.")).toBeInTheDocument();
        expect(screen.queryByText("3-20 characters")).not.toBeInTheDocument();
    });
});