import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import SearchPrompt from "../../../src/components/search/SearchPrompt.jsx";


describe("SearchPrompt", () => {

	// ---------- RENDERING TESTS ----------
	
	it("Renders the search prompt title", () => {
		render(<SearchPrompt />);

		expect(screen.getByText("Start your search")).toBeInTheDocument();
	});


	it("Renders the search instructions", () => {
		render(<SearchPrompt />);

		expect(screen.getByText(/enter a search query above to discover papers/i)).toBeInTheDocument();
	});


	it("Renders the prompt container", () => {
		const { container } = render(<SearchPrompt />);

		expect(container.querySelector("#search-prompt")).toBeInTheDocument();
	});
});