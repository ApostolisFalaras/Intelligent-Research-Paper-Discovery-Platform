import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import ExplorePage from "../../src/ExplorePage.jsx";


// Mock modules, and inner components
const mockSetCachedTopics = vi.fn();
const mockUseExplore = vi.fn();
const mockNavigationType = vi.fn();


vi.mock("../../src/hooks/useExplore.jsx", () => ({
	useExplore: () => mockUseExplore()
}));


vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");

	return {
		...actual,
		useNavigationType: () => mockNavigationType()
	};
});


vi.mock("../../src/components/explore/TopicRow.jsx", () => ({
	default: ({ topicPreview }) => (
		<div data-testid={`topic-row-${topicPreview.topic.id}`}>
			<span>{topicPreview.topic.displayName}</span>
		</div>
	)
}));


vi.mock("../../src/components/explore/ExploreLoading.jsx", () => ({
	default: () => (
		<div data-testid="explore-loading">
			Loading topics...
		</div>
	)
}));


// Mock data
const mockTopics = [
	{
		topic: { id: "T1", displayName: "Machine Learning", fieldDisplayName: "Computer Science" },
		papers: []
	},
	{
		topic: { id: "T2", displayName: "Database Systems", fieldDisplayName: "Computer Science" },
		papers: []
	},
	{
		topic: { id: "T3", displayName: "Quantum Computing", fieldDisplayName: "Physics" },
		papers: []
	}
];


const shuffledTopics = [
	{
		topic: { id: "T4", displayName: "Computer Vision", fieldDisplayName: "Computer Science" },
		papers: []
	},
	{
		topic: { id: "T5", displayName: "Bioinformatics", fieldDisplayName: "Biology" },
		papers: []
	}
];

describe("ExplorePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		global.fetch = vi.fn();

		// Simulate a fresh navigation to the Explore page
		mockNavigationType.mockReturnValue("PUSH");

		mockUseExplore.mockReturnValue({
			cachedTopics: null,
			setCachedTopics: mockSetCachedTopics
		});
	});


	// ---------- INITIAL TOPICS FETCHING ----------

	it("Displays the loading state while topics are being fetched", () => {
		global.fetch.mockResolvedValue(new Promise(() => {}));

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(screen.getByTestId("explore-loading")).toBeInTheDocument();
	});


	it("Fetches random topics when the page mounts", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/explore",
				{
					credentials: "include"
				}
			);
		});

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});


	// ---------- SUCCESSFUL RENDERING TESTS ----------

	it("Displays the topics returned by the API", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(await screen.findByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Database Systems")).toBeInTheDocument();
		expect(screen.getByText("Quantum Computing")).toBeInTheDocument();

		expect(screen.getAllByTestId(/^topic-row-/)).toHaveLength(3);
	});


	it("Removes the loading state after topics are loaded", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		expect(screen.queryByTestId("explore-loading")).not.toBeInTheDocument();
	});


	it("Displays the number of loaded topics", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(await screen.findByText("Discovery feed • 3 topics")).toBeInTheDocument();
	});


	it("Displays zero topics when the API returns an empty array", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(screen.queryByTestId("explore-loading")).not.toBeInTheDocument();
		});

		expect(screen.getByText("Discovery feed • 0 topics")).toBeInTheDocument();

		expect(screen.queryAllByTestId(/^topic-row-/)).toHaveLength(0);
	});


	// ---------- HEADER TESTS ----------

	it("Displays the Explore page header", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(screen.getByRole("heading", { name: "Explore" })).toBeInTheDocument();

		expect(screen.getByText("A random selection of research areas. Shuffle anytime to discover something new."))
			.toBeInTheDocument();

		await screen.findByText("Machine Learning");
	});


	it("Displays the Shuffle topics button", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(screen.getByRole("button", { name: /Shuffle topics/i })).toBeInTheDocument();

		await screen.findByText("Machine Learning");
	});


	// ---------- ERROR HANDLING TESTS ----------

	it("Displays an error message when fetching topics fails", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(await screen.findByText("Could not load topics")).toBeInTheDocument();

		expect(screen.queryByTestId("explore-loading")).not.toBeInTheDocument();

		expect(screen.queryAllByTestId(/^topic-row-/)).toHaveLength(0);

		expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch random topics:", expect.any(Error));

		consoleSpy.mockRestore();
	});


	it("Displays an error message when the request rejects", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		global.fetch.mockRejectedValueOnce(new Error("Network error"));

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(await screen.findByText("Could not load topics")).toBeInTheDocument();

		expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch random topics:", expect.any(Error)); 

		consoleSpy.mockRestore();
	});


	// ---------- SHUFFLE TESTS ----------

	it("Fetches a new set of topics when Shuffle topics is clicked", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: shuffledTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		expect(global.fetch).toHaveBeenNthCalledWith(
			2,
			"/api/explore",
			{
				credentials: "include"
			}
		);
	});


	it("Replaces the displayed topics after shuffling", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: shuffledTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		expect(await screen.findByText("Computer Vision")).toBeInTheDocument();
		expect(screen.getByText("Bioinformatics")).toBeInTheDocument();

		expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();
		expect(screen.queryByText("Database Systems")).not.toBeInTheDocument();

		expect(screen.getAllByTestId(/^topic-row-/)).toHaveLength(2);
	});


	it("Updates the topic count after shuffling", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: shuffledTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Discovery feed • 3 topics");

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		expect(await screen.findByText("Discovery feed • 2 topics")).toBeInTheDocument();
	});


	it("Shows the shuffling state while new topics are being fetched", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		// Extracting the Promise's resolve function in an outside variable
		let resolveShuffle;
		const pendingShuffle = new Promise((resolve) => { resolveShuffle = resolve; });

		global.fetch.mockReturnValueOnce(pendingShuffle);

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		const shuffleButton = screen.getByRole("button", { name: /Shuffling/i });

		expect(shuffleButton).toBeDisabled();
		expect(shuffleButton).toHaveClass("shuffling");

		// This way, we control when the Promise resolves,
		// and we're able to test the shuffling state before the new tests load
		resolveShuffle({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: shuffledTopics
			})
		});

		await screen.findByText("Computer Vision");

		expect(screen.getByRole("button", { name: /Shuffle topics/i })).not.toBeDisabled();
	});


	it("Displays the loading component while shuffling topics", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		// Extracting the Promise's resolve function in an outside variable
		let resolveShuffle;
		const pendingShuffle = new Promise((resolve) => { resolveShuffle = resolve; });

		global.fetch.mockReturnValueOnce(pendingShuffle);

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		expect(screen.getByTestId("explore-loading")).toBeInTheDocument();

		expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();

		// This way, we control when the Promise resolves,
		// and we're able to test the shuffling state before the new tests load
		resolveShuffle({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: shuffledTopics
			})
		});

		await screen.findByText("Computer Vision");
	});


	it("Returns the Shuffle button to its normal state after a shuffle fails", async () => {
		const user = userEvent.setup();

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		expect(await screen.findByText("Could not load topics")).toBeInTheDocument();

		const shuffleButton = screen.getByRole("button", { name: /Shuffle topics/i });

		expect(shuffleButton).not.toBeDisabled();
		expect(shuffleButton).not.toHaveClass("shuffling");

		consoleSpy.mockRestore();
	});


	// ---------- EXPLORE CONTEXT TESTS ----------

	it("Restores cached topics without fetching when returning through browser history", async () => {
		mockNavigationType.mockReturnValue("POP");

		mockUseExplore.mockReturnValue({
			cachedTopics: mockTopics,
			setCachedTopics: mockSetCachedTopics
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(await screen.findByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Database Systems")).toBeInTheDocument();
		expect(screen.getByText("Quantum Computing")).toBeInTheDocument();
		expect(screen.getByText("Discovery feed • 3 topics")).toBeInTheDocument();

		expect(global.fetch).not.toHaveBeenCalled();

		expect(mockSetCachedTopics).not.toHaveBeenCalled();
	});


	it("Fetches new topics on browser history navigation when no cached topics exist", async () => {
		mockNavigationType.mockReturnValue("POP");

		mockUseExplore.mockReturnValue({
			cachedTopics: null,
			setCachedTopics: mockSetCachedTopics
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		expect(await screen.findByText("Machine Learning")).toBeInTheDocument();

		expect(global.fetch).toHaveBeenCalledTimes(1);

		expect(global.fetch).toHaveBeenCalledWith(
			"/api/explore",
			{
				credentials: "include"
			}
		);

		expect(mockSetCachedTopics).toHaveBeenCalledWith(mockTopics);
	});


	it("Updates the cached topics after shuffling", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopics
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: shuffledTopics
			})
		});

		render(
			<MemoryRouter>
				<ExplorePage />
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		expect(mockSetCachedTopics).toHaveBeenCalledWith(mockTopics);

		await user.click(screen.getByRole("button", { name: /Shuffle topics/i }));

		await screen.findByText("Computer Vision");

		expect(mockSetCachedTopics).toHaveBeenCalledTimes(2);
		expect(mockSetCachedTopics).toHaveBeenNthCalledWith(1, mockTopics);
		expect(mockSetCachedTopics).toHaveBeenNthCalledWith(2, shuffledTopics);
	});
});