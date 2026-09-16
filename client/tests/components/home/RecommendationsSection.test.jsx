import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import RecommendationsSection from "../../../src/components/home/RecommendationsSection.jsx";

let mockUser = null;

vi.mock("../../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => ({
		user: mockUser
	})
}));

vi.mock("../../../src/components/home/RecommendationLoading.jsx", () => ({
	default: () => (
		<div data-testid="recommendation-loading">
			Loading recommendations
		</div>
	)
}));

vi.mock("../../../src/components/common/FetchError.jsx", () => ({
	default: ({ fetchError, retrySearchQuery }) => (
		<div>
			<p>{fetchError}</p>

			<button type="button" onClick={retrySearchQuery}>
				Retry
			</button>
		</div>
	)
}));

vi.mock("../../../src/components/home/RecommendationsRow.jsx", () => ({
	default: ({ type, label, papers }) => (
		<section data-testid="recommendations-row">
			<span>{type}</span>
			<h2>{label}</h2>
			<span>{papers.length} papers</span>
		</section>
	)
}));


// Mock recommendation data
const recommendations = {
    sections: [
        {
            type: "popular",
            header: "Popular papers",
            papers: [
                { id: 1, title: "Paper A" },
                { id: 2, title: "Paper B" }
            ]
        },
        {
            type: "interests",
            header: "Based on your interests",
            papers: [
                { id: 3, title: "Paper C" }
            ]
        }
    ]
};


describe("RecommendationsSection", () => {

	// ---------- RENDERING TESTS ----------

	it("Shows the loading state", () => {
		render(
			<MemoryRouter>
				<RecommendationsSection 
					recommendations={recommendations}
					status="loading"
					fetchError=""
					retrySearch={vi.fn()}
				/>
			</MemoryRouter>
		);

		expect(screen.getByTestId("recommendation-loading")).toBeInTheDocument();
	});


	it("Shows the error state", () => {
		render(
			<MemoryRouter>
				<RecommendationsSection 
					recommendations={recommendations}
					status="error"
					fetchError="Failed to load recommendations"
					retrySearch={vi.fn()}
				/>
			</MemoryRouter>
		);

		expect(screen.getByText("Failed to load recommendations")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
	});


	it("Shows popular research for unauthenticated users", () => {
        mockUser = null;

        render(
			<MemoryRouter>
				<RecommendationsSection 
					recommendations={recommendations}
					status="success"
					fetchError="Failed to load recommendations"
					retrySearch={vi.fn()}
				/>
			</MemoryRouter>
		);

        expect(screen.getByText("Discover what researchers are reading")).toBeInTheDocument();
        expect(screen.getByText("Popular research")).toBeInTheDocument();
    });


	it("Shows the personalized feed for authenticated users", () => {
        mockUser = { firstName: "John", lastName: "Doe" };

        render(
			<MemoryRouter>
				<RecommendationsSection
					recommendations={recommendations}
					status="success"
					fetchError=""
					retrySearch={vi.fn()}
				/>
			</MemoryRouter>
        );

        expect(screen.getByText("Personalized recommendations • John Doe")).toBeInTheDocument();
        expect(screen.getByText("Your research feed")).toBeInTheDocument();
    });


    it("Renders every recommendation section", () => {
        mockUser = null;

        render(
			<MemoryRouter>
				<RecommendationsSection
					recommendations={recommendations}
					status="success"
					fetchError=""
					retrySearch={vi.fn()}
				/>
			</MemoryRouter>
        );

        expect(screen.getAllByTestId("recommendations-row")).toHaveLength(2);
        expect(screen.getByText("Popular papers")).toBeInTheDocument();
        expect(screen.getByText("Based on your interests")).toBeInTheDocument();
        expect(screen.getByText("2 papers")).toBeInTheDocument();
        expect(screen.getByText("1 papers")).toBeInTheDocument();
    });

});