import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import HomePage from "../../src/HomePage.jsx";


// Mock of user authentication hook
let mockUser = null;

vi.mock("../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => ({
		user: mockUser
	})
}));


// Mock of inner elements
vi.mock("../../src/components/home/RecommendationsSection.jsx",() => ({
	
	default: ({ recommendations, status, fetchError, retrySearch }) => (
		<div data-testid="recommendations-section">
			<span data-testid="status">{status}</span>
			<span data-testid="fetch-error">{fetchError}</span>
			<span data-testid="recommendation-count">{recommendations?.sections?.length ?? 0}</span>
			
			<button type="button" onClick={retrySearch}>
				Retry
			</button>
		</div>
	)
}));

vi.mock("../../src/components/home/Hero.jsx",() => ({
	default: () => (
		<div data-testid="hero">
			Hero
		</div>
	)
}));

vi.mock("../../src/components/home/StatsStrip.jsx",() => ({
	default: () => (
		<div data-testid="stats-strip">
			Stats
		</div>
	)
}));


// Mock Recommendations
const mockRecommendations = {
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


describe("HomePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockUser = null;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockRecommendations
			})
		})
	});


	// ---------- RENDERING TESTS ----------

	it("Renders the main home page sections", () => {
		render(<HomePage />);

		expect(screen.getByTestId("hero")).toBeInTheDocument();
		expect(screen.getByTestId("stats-strip")).toBeInTheDocument();
		expect(screen.getByTestId("recommendations-section")).toBeInTheDocument();
	});


	// ---------- INITIAL LOADING STATE ----------

    it("Starts recommendations in the loading state", () => {
        global.fetch.mockImplementation(() => new Promise(() => {}));

        render(<HomePage />);

        expect(screen.getByTestId("status")).toHaveTextContent("loading");
    });


	// ---------- API REQUEST TESTS ----------

    it("Fetches home recommendations when the page loads", async () => {
        render(<HomePage />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/recommendations/home",
                {
                    credentials: "include"
                }
            );
        });
    });


	it("Loads recommendations returned by the API", async () => {
        render(<HomePage />);

		await waitFor(() => {
			expect(screen.getByTestId("status")).toHaveTextContent("success");
		});

		expect(screen.getByTestId("recommendation-count")).toHaveTextContent("2");
	});


	// ---------- ERROR TEST CASES ----------

	it("Shows an error state when fetching recommendations fails", async () => {
        global.fetch.mockRejectedValue(new Error("Network failure"));

        render(<HomePage />);

        await waitFor(() => {
            expect(screen.getByTestId("status")).toHaveTextContent("error");
        });

        expect(screen.getByTestId("fetch-error"))
			.toHaveTextContent("Could not load recommendations. Check your connection and try again.");

        expect(screen.getByTestId("recommendation-count")).toHaveTextContent("0");
    });


	it("Shows an error when the API request fails", async () => {
		global.fetch.mockResolvedValue({
			ok: false,
			status: 500
		});

		render(<HomePage />);

		await waitFor(() => {
			expect(screen.getByTestId("status")).toHaveTextContent("error");
		});

		expect(screen.getByTestId("fetch-error"))
			.toHaveTextContent("Could not load recommendations. Check your connection and try again.");
	});


	// ---------- RETRY API REQUEST TEST ----------

	it("Retries loading recommendations", async () => {
        const user = userEvent.setup();

        global.fetch
            .mockRejectedValueOnce(new Error("Network failure"))
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: vi.fn().mockResolvedValue({
                    data: mockRecommendations
                })
            });

        render(<HomePage />);

        await waitFor(() => {
            expect(screen.getByTestId("status")).toHaveTextContent("error");
        });

        await user.click(screen.getByRole("button", { name: "Retry" }));

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        await waitFor(() => {
            expect(screen.getByTestId("status")).toHaveTextContent("success");
        });

        expect(screen.getByTestId("recommendation-count")).toHaveTextContent("2");
    });


	 // ---------- AUTHENTICATION CHANGE TEST ----------

    it("Refetches recommendations when the user changes", async () => {
        const { rerender } = render(<HomePage />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

		// User logs in, so we re-render the page
        mockUser = {
            id: 123,
            firstName: "John",
            lastName: "Doe"
        };

        rerender(<HomePage />);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});