import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import AuthorPage from "../../src/AuthorPage.jsx";


// Mocking inner elements and auth hook
const mockUseAuth = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();


vi.mock("../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => mockUseAuth()
}));


vi.mock("sonner", () => ({
	toast: {
		success: (...args) => mockToastSuccess(...args),
		error: (...args) => mockToastError(...args)
	}
}));


vi.mock("../../src/components/authors/AuthorLoading.jsx", () => ({
	default: () => (
		<div data-testid="author-loading">
			Loading author...
		</div>
	)
}));


vi.mock("../../src/components/authors/AuthorTopics.jsx", () => ({
	default: ({ topics }) => (
		<div
			data-testid="author-topics"
			data-topic-count={topics?.length ?? 0}
		>
			Author topics
		</div>
	)
}));


vi.mock("../../src/components/authors/CitationsChart.jsx", () => ({
	default: ({ data }) => (
		<div
			data-testid="citations-chart"
			data-year-count={data?.length ?? 0}
		>
			Citations chart
		</div>
	)
}));


vi.mock("../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper }) => (
		<div data-testid={`paper-card-${paper.id}`}>
			{paper.title}
		</div>
	)
}));


// ---------- MOCK DATA ----------

const mockAuthor = {
	id: "A5029524538",
	internalId: "248993",
	displayName: "Allen D. Malony",
	orcid: "0000-0001-2345-6789",
	worksCount: 125,
	citedByCount: 8450,
	hIndex: 42,
	i10Index: 87,
	twoYearMeanCitedness: 3.7,
	isFollowed: false,
	lastKnownInstitutions: [
		{
			id: "I1",
			displayName: "University of Oregon",
			countryCode: "US",
			institutionType: "education"
		}
	],
	affiliations: [
		{
			id: "I2",
			displayName: "Research Institute",
			countryCode: "US",
			institutionType: "facility",
			years: [2010, 2011, 2012]
		},
		{
			id: "I1",
			displayName: "University of Oregon",
			countryCode: "US",
			institutionType: "education",
			years: [2018, 2019, 2020, 2021, 2022]
		}
	],
	topics: [
		{ id: "T1", displayName: "High Performance Computing" },
		{ id: "T2", displayName: "Parallel Computing" }
	],
	countsByYear: [
		{ year: 2023, worksCount: 10, oaWorksCount: 8, citedByCount: 200 },
		{ year: 2024, worksCount: 12, oaWorksCount: 9, citedByCount: 250 }
	],
	topPapers: [
		{ id: "W1", title: "Top Paper One" },
		{ id: "W2", title: "Top Paper Two" }
	],
	topicShares: [
		{ id: "T1", displayName: "High Performance Computing", value: 60 },
		{ id: "T2", displayName: "Parallel Computing", value: 30 },
		{ id: "T3", displayName: "Performance Analysis", value: 10 }
	]
};


describe("AuthorPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();

		mockUseAuth.mockReturnValue({
			user: {
				userId: 123,
				username: "testuser"
			}
		});
	});


	// ---------- INITIAL FETCHING TESTS ----------
	
	it("Displays the loading state while the author is being fetched", () => {
		globalThis.fetch.mockReturnValue(new Promise(() => {}));

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByTestId("author-loading")).toBeInTheDocument();
	});


	it("Fetches the author using the route parameter", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledWith(
				"/api/authors/A5029524538",
				{
					credentials: "include"
				}
			);
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});


	it("Fetches a different author when a different route id is used", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					id: "A999",
					displayName: "Different Author"
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A999"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledWith(
				"/api/authors/A999",
				{
					credentials: "include"
				}
			);
		});

		expect(await screen.findByRole("heading", { name: "Different Author" }))
			.toBeInTheDocument();
	});


	it("Handles failure to fetch author information", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		globalThis.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch author info:",
				expect.any(Error)
			);
		});

		expect(screen.queryByTestId("author-loading")).not.toBeInTheDocument();

		consoleSpy.mockRestore();
	});


	// ---------- RENDERING TESTS ----------

	it("Displays the author's name and initials", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByRole("heading", { name: "Allen D. Malony" })).toBeInTheDocument();
		expect(screen.getByText("ADM")).toBeInTheDocument();
	});


	it("Displays the author's current institution", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		// The institution is rendered both in the header and the sidebar.
		expect(screen.getAllByText("University of Oregon")).toHaveLength(3);
		expect(screen.getAllByText("University")).toHaveLength(2);
	});


	it("Displays the author's ORCID link", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		const orcidLink = screen.getByRole("link", { name: /ORCID.*0000-0001-2345-6789/i });

		expect(orcidLink).toHaveAttribute("href","https://orcid.org/0000-0001-2345-6789");
		expect(orcidLink).toHaveAttribute("target", "_blank");
		expect(orcidLink).toHaveAttribute("rel", "noopener noreferrer");
	});


	it("Does not display an ORCID link when the author has no ORCID", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					orcid: null
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		expect(screen.queryByRole("link", { name: /ORCID/i })).not.toBeInTheDocument();
	});


	// ---------- AUTHOR STATISTICS ----------

	it("Displays the author's statistics", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		expect(screen.getByText("Publications")).toBeInTheDocument();
		expect(screen.getByText("125")).toBeInTheDocument();

		expect(screen.getByText("Citations")).toBeInTheDocument();
		expect(screen.getByText("8450")).toBeInTheDocument();

		expect(screen.getByText("H-Index")).toBeInTheDocument();
		expect(screen.getByText("42")).toBeInTheDocument();

		expect(screen.getByText("i10-Index")).toBeInTheDocument();
		expect(screen.getByText("87")).toBeInTheDocument();

		expect(screen.getByText("2yr Mean Citedness")).toBeInTheDocument();
		expect(screen.getByText("3.7")).toBeInTheDocument();
	});


	// ---------- CHILD COMPONENTS TESTS ----------

	it("Passes the author's topics to AuthorTopics", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		expect(screen.getByTestId("author-topics")).toHaveAttribute("data-topic-count", "2");
	});


	it("Passes citation history to CitationsChart", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		expect(screen.getByTestId("citations-chart")).toHaveAttribute("data-year-count", "2");
	});


	it("Displays the author's top papers", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByText("Top Paper One")).toBeInTheDocument();
		expect(screen.getByText("Top Paper Two")).toBeInTheDocument();

		expect(screen.getAllByTestId(/^paper-card-/)).toHaveLength(2);
	});


	// ---------- AFFILIATIONS TESTS ----------

	it("Displays the author's career history", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		expect(screen.getByText("Career History")).toBeInTheDocument();

		// University of Oregon also appears in the current
		// institution sections, so use getAllByText here.
		expect(screen.getAllByText("University of Oregon").length).toBeGreaterThan(0);

		expect(screen.getByText("Research Institute")).toBeInTheDocument();
	});


	it("Sorts career affiliations from most recent to oldest", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		const { container } = render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		const affiliations = Array.from(container.querySelectorAll(".affiliation-name"));

		expect(affiliations.map((element) => element.textContent)).toEqual([
			"University of Oregon",
			"Research Institute"
		]);
	});


	// ---------- TOPIC SHARES ----------

	it("Displays the author's top research interests", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		expect(screen.getByText("Top Research Interests")).toBeInTheDocument();
		expect(screen.getByText("High Performance Computing")).toBeInTheDocument();
		expect(screen.getByText("Parallel Computing")).toBeInTheDocument();
		expect(screen.getByText("Performance Analysis")).toBeInTheDocument();
	});


	it("Normalizes topic shares into percentages", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await screen.findByRole("heading", { name: "Allen D. Malony" });

		// Total = 60 + 30 + 10 = 100
		expect(screen.getByText("60.0%")).toBeInTheDocument();
		expect(screen.getByText("30.0%")).toBeInTheDocument();
		expect(screen.getByText("10.0%")).toBeInTheDocument();
	});


	// ---------- FOLLOWING TESTS ----------

	it("Displays Follow when the author is not followed", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					isFollowed: false
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByRole("button", { name: "Follow" })).toBeInTheDocument();
	});


	it("Displays Following when the author is already followed", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					isFollowed: true
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByRole("button", { name: "Following" })).toBeInTheDocument();
	});


	it("Disables the follow button for an unauthenticated user", async () => {
		mockUseAuth.mockReturnValue({ user: null });

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockAuthor
			})
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		expect(await screen.findByRole("button", { name: "Follow" })).toBeDisabled();
	});


	it("Follows an author when Follow is clicked", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					isFollowed: false
				}
			})
		});


		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		const followButton = await screen.findByRole("button", { name: "Follow" });

		await user.click(followButton);

		expect(globalThis.fetch).toHaveBeenLastCalledWith(
			"/api/authors/A5029524538/follow",
			{
				method: "POST",
				credentials: "include"
			}
		);

		expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();

		expect(mockToastSuccess).toHaveBeenCalled();
	});


	it("Unfollows an author when Following is clicked", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					isFollowed: true
				}
			})
		});

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		const followingButton = await screen.findByRole("button", { name: "Following" });
		await user.click(followingButton);

		expect(globalThis.fetch).toHaveBeenLastCalledWith(
			"/api/authors/A5029524538/unfollow",
			{
				method: "POST",
				credentials: "include"
			}
		);

		expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();

		expect(mockToastSuccess).toHaveBeenCalled();
	});


	it("Handles failure to follow an author", async () => {
		const user = userEvent.setup();

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					isFollowed: false
				}
			})
		});

		globalThis.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await user.click(await screen.findByRole("button", { name: "Follow" }));

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalled();
		});

		// State must remain unchanged after failure.
		expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();

		expect(consoleSpy).toHaveBeenCalledWith("Failed to follow author:", expect.any(Error));

		consoleSpy.mockRestore();
	});


	it("Handles failure to unfollow an author", async () => {
		const user = userEvent.setup();

		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					...mockAuthor,
					isFollowed: true
				}
			})
		});

		globalThis.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter initialEntries={["/authors/A5029524538"]}>
				<Routes>
					<Route
						path="/authors/:id"
						element={<AuthorPage />}
					/>
				</Routes>
			</MemoryRouter>
		);

		await user.click(await screen.findByRole("button", { name: "Following" }));

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalled();
		});

		expect(screen.getByRole("button", { name: "Following" })).toBeInTheDocument();

		expect(consoleSpy).toHaveBeenCalledWith("Failed to unfollow author:", expect.any(Error));

		consoleSpy.mockRestore();
	});
});