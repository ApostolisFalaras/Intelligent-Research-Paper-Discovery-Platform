import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FilterSection from "../../../src/components/search/FilterSection.jsx";


describe("FilterSection", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders the provided title", () => {
		render(
			<FilterSection title="Access">
				<p>Filter contents</p>
			</FilterSection>
		);

		expect(screen.getByRole("button", { name: /access/i })).toBeInTheDocument();
	});


	it("Renders its children by default", () => {
		render(
			<FilterSection title="Access">
				<p>Filter contents</p>
			</FilterSection>
		);

		expect(screen.getByText("Filter contents")).toBeInTheDocument();
	});


	// ---------- USER TOGGLES THE FILTER SECTION ----------

	it("Collapses the section when the title is clicked", async () => {
		const user = userEvent.setup();

		render(
			<FilterSection title="Access">
				<p>Filter contents</p>
			</FilterSection>
		);

		const button = screen.getByRole("button", { name: /access/i });

		await user.click(button);

		expect(screen.queryByText("Filter contents")).not.toBeInTheDocument();
	});

	
	it("Reopens the section after being collapsed", async () => {
		const user = userEvent.setup();

		render(
			<FilterSection title="Access">
				<p>Filter contents</p>
			</FilterSection>
		);

		const button = screen.getByRole("button", { name: /access/i });

		await user.click(button);
		await user.click(button);

		expect(screen.getByText("Filter contents")).toBeInTheDocument();
	});
});