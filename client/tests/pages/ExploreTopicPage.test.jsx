import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ExploreTopicPage from "../../src/ExploreTopicPage.jsx";


// Mock inner PaperCard element
vi.mock("../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper, topicColor }) => (
		<div
			data-testid={`paper-card-${paper.id}`}
			data-topic-color={topicColor}
		>
			<span>{paper.title}</span>
			<span>{paper.publicationYear}</span>
			<span>{paper.citedByCount} citations</span>
		</div>
	)
}));


// Mock data
const mockTopicInfo = {
	topic: {
		id: "T100",
		displayName: "Machine Learning",
		fieldDisplayName: "Computer Science"
	},
	totalResults: 42,
	papers: [
		{
			id: "W1",
			title: "Older Highly Cited Paper",
			publicationYear: 2020,
			citedByCount: 500
		},
		{
			id: "W2",
			title: "Newest Paper",
			publicationYear: 2025,
			citedByCount: 50
		},
		{
			id: "W3",
			title: "Middle Paper",
			publicationYear: 2023,
			citedByCount: 200
		}
	]
};


describe("ExplorePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		global.fetch = vi.fn();

		Object.defineProperty(window, "scrollTo", {
			value: vi.fn(),
			writable: true
		});
	});


	// ---------- INITIAL FETCHING TESTS ----------

	it("Fetches the topic using the route parameter", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/explore/T100?page=1&limit=15&sort=citations",
				{
					credentials: "include"
				}
			);
		});

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});


	it("Fetches the requested topic when a different topic id is used", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockTopicInfo,
					topic: {
						id: "T200",
						displayName: "Database Systems",
						fieldDisplayName: "Computer Science"
					}
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T200"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/explore/T200?page=1&limit=15&sort=citations",
				{
					credentials: "include"
				}
			);
		});
	});


	it("Handles failure to fetch topic information", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch topic info:",
				expect.any(Error)
			);
		});

		expect(screen.getByRole("heading", { name: "Topic Name" })).toBeInTheDocument();

		expect(screen.queryAllByTestId(/^paper-card-/)).toHaveLength(0);

		consoleSpy.mockRestore();
	});
	

	// ---------- SCROLL TEST ----------

	it("Scrolls to the top when the page mounts", () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		expect(window.scrollTo).toHaveBeenCalledWith({
			top: 0,
			left: 0,
			behavior: "instant"
		});
	});


	// ---------- RENDERING TESTS ----------
	
	it("Displays the topic information", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByRole("heading", { name: "Machine Learning"})).toBeInTheDocument();

		expect(screen.getByText("Computer Science")).toBeInTheDocument();
		expect(screen.getByText("42 papers")).toBeInTheDocument();
	});


	it("Displays the papers returned by the API", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByText("Older Highly Cited Paper")).toBeInTheDocument();
		expect(screen.getByText("Newest Paper")).toBeInTheDocument();
		expect(screen.getByText("Middle Paper")).toBeInTheDocument();

		expect(screen.getAllByTestId(/^paper-card-/)).toHaveLength(3);
	});


	// ---------- SORTING TESTS ----------


	it("Uses Most cited sorting initially", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Older Highly Cited Paper");

		expect(screen.getByRole("button", { name: "Most cited" })).toHaveClass("active");
		expect(screen.getByRole("button", { name: "Recent" })).not.toHaveClass("active");
		expect(screen.getByRole("button", { name: "Popular" })).not.toHaveClass("active");
	});


	it("Fetches recently sorted papers when Recent is selected", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockTopicInfo,
					papers: [
						mockTopicInfo.papers[1],
						mockTopicInfo.papers[2],
						mockTopicInfo.papers[0]
					]
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Older Highly Cited Paper");

		await user.click(screen.getByRole("button", { name: "Recent" }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenLastCalledWith(
				"/api/explore/T100?page=1&limit=15&sort=recent",
				{
					credentials: "include"
				}
			);
		});

		const paperCards = screen.getAllByTestId(/^paper-card-/);

		expect(paperCards[0]).toHaveTextContent("Newest Paper");
		expect(paperCards[1]).toHaveTextContent("Middle Paper");
		expect(paperCards[2]).toHaveTextContent("Older Highly Cited Paper");

		expect(screen.getByRole("button", { name: "Recent" })).toHaveClass("active");
	});


	it("Fetches papers using Popular sorting when selected", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: "Popular" }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenLastCalledWith(
				"/api/explore/T100?page=1&limit=15&sort=popular",
				{
					credentials: "include"
				}
			);
		});

		expect(screen.getByRole("button", { name: "Popular" })).toHaveClass("active");
	});


	// ---------- PAGINATION TESTS ----------

	it("Displays pagination when more than one page exists", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		expect(screen.getByRole("button", { name: /Prev/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Next/i })).toBeInTheDocument();

		expect(screen.getByRole("button", { name: "1" })).toHaveClass("active");
		expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
	});


	it("Does not display pagination when only one page exists", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: { 
					...mockTopicInfo,
					totalResults: 10 
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		expect(screen.queryByRole("button", { name: /Prev/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /Next/i })).not.toBeInTheDocument();
	});


	it("Fetches another page when a page number is selected", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: { 
					...mockTopicInfo,
					papers: [
						{
							id: "W20",
							title: "Page Two Paper",
							publicationYear: 2024,
							citedByCount: 100
						}
					]
				}
			})
		});


		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: "2" }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/explore/T100?page=2&limit=15&sort=citations",
				{
					credentials: "include"
				}
			);
		});

		expect(global.fetch).toHaveBeenCalledTimes(2);

		expect(await screen.findByText("Page Two Paper")).toBeInTheDocument();

		expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
	});


	it("Displays pagination ellipses when pages are far apart", async () => {
		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: { 
					...mockTopicInfo,
					totalResults: 150 
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		const ellipses = document.querySelectorAll(".explore-ellipsis");
		expect(ellipses.length).toBeGreaterThan(0);
	});


	it("Moves to the previous page when Prev is clicked", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: "2" }));

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
		});

		await user.click(screen.getByRole("button", { name: /Prev/i }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenLastCalledWith(
				"/api/explore/T100?page=1&limit=15&sort=citations",
				{
					credentials: "include"
				}
			);
		});

		expect(screen.getByRole("button", { name: "1" })).toHaveClass("active");
	});


	it("Moves to the next page when Next is clicked", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: /Next/i }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenLastCalledWith(
				"/api/explore/T100?page=2&limit=15&sort=citations",
				{
					credentials: "include"
				}
			);
		});

		expect(screen.getByRole("button", { name: "2" })).toHaveClass("active");
	});


	it("Returns to page 1 when the sorting option changes", async () => {
		const user = userEvent.setup();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockTopicInfo,
					papers: [
						{
							id: "W20",
							title: "Page Two Paper",
							publicationYear: 2024,
							citedByCount: 100
						}
					]
				}
			})
		});

		// Changing sort while already on page 2 causes another request because setPage(1) changes page.
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockTopicInfo
			})
		});

		render(
			<MemoryRouter initialEntries={["/explore/topic/T100"]}>
				<Routes>
					<Route path="/explore/topic/:id" element={<ExploreTopicPage />} />
				</Routes>
			</MemoryRouter>
		);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByRole("button", { name: "2" }));

		await screen.findByText("Page Two Paper");

		await user.click(screen.getByRole("button", { name: "Recent" }));

		await waitFor(() => {
			expect(global.fetch).toHaveBeenLastCalledWith(
				"/api/explore/T100?page=1&limit=15&sort=recent",
				{
					credentials: "include"
				}
			);
		});

		expect(screen.getByRole("button", { name: "1" })).toHaveClass("active");
	});
});