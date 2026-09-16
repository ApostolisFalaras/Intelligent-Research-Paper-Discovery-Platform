import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import Hero from "../../../src/components/home/Hero.jsx";

vi.mock("../../../src/components/home/FloatingPapers.jsx", () => ({
	default: () => (
		<div data-testid="floating-papers" />
	)
}));

vi.mock("../../../src/components/search/SearchBar.jsx", () => ({
	default: ({ variant }) => (
		<div data-testid="search-bar">
			{variant}
		</div>
	)
}));


describe("Hero", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders the home page hero content", () => {
		render(<Hero />);

		expect(screen.getByText("RESEARCH INTELLIGENCE PLATFORM")).toBeInTheDocument();
		expect(screen.getByText(/Discover the science that/i)).toBeInTheDocument();
		expect(screen.getByText("shapes tomorrow")).toBeInTheDocument();
	});


	it("Renders the hero SearchBar variant", () => {
		render(<Hero />);

		expect(screen.getByTestId("search-bar")).toBeInTheDocument();
	});


	it("Renders the floating paper background", () => {
        render(<Hero />);

        expect(screen.getByTestId("floating-papers")).toBeInTheDocument();
    });
});