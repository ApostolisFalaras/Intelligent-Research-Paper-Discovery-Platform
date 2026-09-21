import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import AuthorLoading from "../../../src/components/authors/AuthorLoading.jsx";


describe("AuthorLoading", () => {

	// ---------- RENDERING TESTS ----------
	
	it("Displays the author loading message", () => {
		render(<AuthorLoading />);

		expect(screen.getByText("Loading author profile")).toBeInTheDocument();

		expect(screen.getByText("We're retrieving the author's publications, research areas, citation metrics, and profile information."))
			.toBeInTheDocument();
	});


	it("Displays the author loading container and icon", () => {
		const { container } = render(<AuthorLoading />);

		expect(container.querySelector("#author-loading")).toBeInTheDocument();
		expect(container.querySelector("#author-loading-svg")).toBeInTheDocument();
		expect(container.querySelector("#author-loading-svg svg")).toBeInTheDocument();
	});
});