import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import RecommendationsRow from "../../../src/components/home/RecommendationsRow.jsx";

vi.mock("../../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper }) => (
		<article data-testid="paper-card">
			{paper.title}
		</article>
	)
}));


// Mock papers data
const papers = [
	{ id: 1, title: "Attention Is All You Need" },
	{ id: 2, title: "BERT" },
	{ id: 3, title: "ResNet" }
];


describe("RecommendationsRow", () => {

	// ---------- RENDERING TESTS ----------

	it("Renders the section heading", () => {
		render(
			<MemoryRouter>
				<RecommendationsRow 
					type="popular"
					label="Popular papers"
					icon={<span>Icon</span>}
					papers={papers}
				/>
			</MemoryRouter>
		);

		expect(screen.getByText("Popular papers")).toBeInTheDocument();
        expect(screen.getByText("Icon")).toBeInTheDocument();
	});


	it("Renders a PaperCard for every paper", () => {
		render(
			<MemoryRouter>
				<RecommendationsRow 
					type="popular"
					label="Popular papers"
					icon={null}
					papers={papers}
				/>
			</MemoryRouter>
		);

		expect(screen.getAllByTestId("paper-card")).toHaveLength(3);
		
		expect(screen.getByText("Attention Is All You Need")).toBeInTheDocument();
        expect(screen.getByText("BERT")).toBeInTheDocument();
        expect(screen.getByText("ResNet")).toBeInTheDocument();
	});


	it("Links See all to the correct recommendation type", () => {
		render(
			<MemoryRouter>
				<RecommendationsRow 
					type="popular"
					label="Popular papers"
					icon={null}
					papers={papers}
				/>
			</MemoryRouter>
		);

		const link = screen.getByRole("link", { name: /see all/i });
		
		expect(link).toHaveAttribute("href", "/recommendations?type=popular");
	});


	it("Handles an empty papers array", () => {
        render(
            <MemoryRouter>
                <RecommendationsRow
                    type="popular"
                    label="Popular papers"
                    icon={null}
                    papers={[]}
                />
            </MemoryRouter>
        );

        expect(screen.queryAllByTestId("paper-card")).toHaveLength(0);
        expect(screen.getByText("Popular papers")).toBeInTheDocument();
    });
});