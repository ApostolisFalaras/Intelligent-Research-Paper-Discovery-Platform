import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import SkeletonCard from "../../../src/components/search/SkeletonCard.jsx";

describe("SkeletonCard", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders a skeleton article", () => {
		const { container } = render(<SkeletonCard />);

		const article = container.querySelector("article");
		
		expect(article).toBeInTheDocument();
	});


	it("Renders the animated skeleton contents", () => {
		const { container } = render(<SkeletonCard />);

		const article = container.querySelector("article");
		const animatedContainer = article.firstElementChild;

		expect(animatedContainer).toBeInTheDocument();
		expect(animatedContainer).toHaveStyle({
			animation: "pulse 1.6s ease-in-out infinite"
		});
	});
});