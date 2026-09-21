import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import ExploreLoading from "../../../src/components/explore/ExploreLoading.jsx";


describe("ExploreLoading", () => {

	it("Displays the explore loading state", () => {
		render(<ExploreLoading />);

		expect(screen.getByText("Discovering research topics")).toBeInTheDocument();

		expect(screen.getByText("We're selecting a random collection of research areas for you to explore. This usually takes only a moment."))
			.toBeInTheDocument();
	});


	it("Renders the loading container", () => {
		const { container } = render(<ExploreLoading />);

		expect(container.querySelector("#explore-loading")).toBeInTheDocument();

		expect(container.querySelector("#explore-loading-icon")).toBeInTheDocument();
	});

});