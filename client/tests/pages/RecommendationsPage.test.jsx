import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import RecommendationsPage from "../../src/RecommendationsPage.jsx";


// Mocking inner components
vi.mock("../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper }) => (
		<div data-testid="paper-card">
			{paper.title}
		</div>
	)
}));

// Mock data
const mockPapers = [
    { id: 1, title: "Machine Learning Paper" },
    { id: 2, title: "Database Systems Paper" }
];

const mockRecommendationData = {
    papers: mockPapers,
    totalPapers: 30,
    availableTypes: ["popular", "activity", "similar", "topics"]
};


describe("RecommendationsPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();

		Object.defineProperty(window, "scrollTo", {
			value: vi.fn(),
			writable: true
		});
	});

	
	// ---------- INITIAL RENDERING TESTS ----------

	it("Fetches activity recommendations from page 1 by default", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({ data: mockRecommendationData })
        });

		render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/recommendations?type=activity&page=1&limit=15",
                {
                    credentials: "include"
                }
            );
        });
    });


	it("Uses activity recommendations when no type query parameter exists", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/recommendations?type=activity&page=1&limit=15",
                {
                    credentials: "include"
                }
            );
        });

        expect(screen.getByRole("heading", { name: "Based on your activity" })).toBeInTheDocument();
    });


	it("Fetches the recommendation type provided in the URL", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

		render(
			<MemoryRouter initialEntries={["/recommendations?type=popular"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/recommendations?type=popular&page=1&limit=15",
                {
                    credentials: "include"
                }
            );
        });

        expect(screen.getByRole("heading", { name: "Popular papers" })).toBeInTheDocument();
    });


	// ---------- PAPER RENDERING TEST ----------

	it("Renders the returned recommendation papers", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        expect(await screen.findByText("Machine Learning Paper")).toBeInTheDocument();

        expect(screen.getByText("Database Systems Paper")).toBeInTheDocument();

        expect(screen.getAllByTestId("paper-card")).toHaveLength(2);
    });


	// ---------- RECOMMENDATION TYPES TESTS ----------

	it("Renders all available recommendation type buttons", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await screen.findByText("Machine Learning Paper");

        expect(screen.getByRole("link", { name: /Popular papers/i })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: /Based on your activity/i })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: /Researchers with similar interests also viewed/i }))
			.toBeInTheDocument();

        expect(screen.getByRole("link", { name: /Explore your research topics/i })).toBeInTheDocument();
    });


	it("Marks the current recommendation type as active", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

		render(
			<MemoryRouter initialEntries={["/recommendations?type=popular"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        const popularLink = await screen.findByRole("link", { name: /Popular papers/i });

        expect(popularLink).toHaveClass("active");

        expect(screen.getByRole("link", { name: /Based on your activity/i })).not.toHaveClass("active");
    });


	it("Fetches the new recommendation type after switching types", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        const popularLink = await screen.findByRole("link", { name: /Popular papers/i });
        await user.click(popularLink);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/recommendations?type=popular&page=1&limit=15",
                {
                    credentials: "include"
                }
            );
        });
    });


	// ---------- PAGINATION TESTS ----------

	it("Does not display pagination when there is only one page", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: {
                    ...mockRecommendationData,
                    totalPapers: 15
                }
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await screen.findByText("Machine Learning Paper");

        expect(screen.queryByText("Prev")).not.toBeInTheDocument();

        expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });


    it("Displays pagination when there is more than one page", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: {
                    ...mockRecommendationData,
                    totalPapers: 30
                }
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        expect(await screen.findByText("Prev")).toBeInTheDocument();

        expect(screen.getByText("Next")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    });


    it("Marks the first page as active initially", async () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        const pageOne = await screen.findByRole("button", { name: "1" });

        expect(pageOne).toHaveClass("active");
    });


    it("Fetches another page when a page number is clicked", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        const pageTwo = await screen.findByRole("button", { name: "2" });
        await user.click(pageTwo);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/recommendations?type=activity&page=2&limit=15",
                {
                    credentials: "include"
                }
            );
        });

        expect(pageTwo).toHaveClass("active");
    });


	// ---------- ERROR HANDLING TESTS ----------

    it("Clears recommendations when the API request fails", async () => {
		// Prevent console from logging on the console while testing the failure case
        const consoleSpy = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});

        globalThis.fetch.mockResolvedValue({
            ok: false,
            status: 500
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        });

        await waitFor(() => {
            expect(screen.queryByTestId("paper-card")).not.toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });


    it("Handles a network error without rendering papers", async () => {
        const consoleSpy = vi
            .spyOn(console, "log")
            .mockImplementation(() => {});

        globalThis.fetch.mockRejectedValue(new Error("Network error"));

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        });

        expect(screen.queryByTestId("paper-card")).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });


    // ---------- PAGE BEHAVIOR TEST ----------

    it("Scrolls to the top when the page mounts", () => {
        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                data: mockRecommendationData
            })
        });

        render(
			<MemoryRouter initialEntries={["/recommendations?type=activity"]}>
				<RecommendationsPage />
			</MemoryRouter>
		);

        expect(window.scrollTo).toHaveBeenCalledWith({
            top: 0,
            left: 0,
            behavior: "instant"
        });
    });
});