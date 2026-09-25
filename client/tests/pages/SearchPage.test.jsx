import { describe, it, expect, vi, afterEach, beforeEach, } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import SearchPage from "../../src/SearchPage.jsx";


// Mock the toast warning message
const toastWarning = vi.fn();

vi.mock("sonner", () => ({
	toast: {
		warning: (...args) => toastWarning(...args)
	}
}));

// Mock all imported child React elements, using simple and predictable components
vi.mock("../../src/components/search/FilterSection.jsx", () => ({
	default: ({ title, children }) => (
		<section>
			<h2>{title}</h2>
			{children}
		</section>
	)
}));

vi.mock("../../src/components/search/ToggleItem.jsx", () => ({
	default: ({ label, checked, onChange }) => (
		<button
			type="button"
			aria-pressed={checked}
			onClick={onChange}
		>
			{label}
		</button>
	)
}));

vi.mock("../../src/components/search/TopicSelect.jsx", () => ({
	default: ({ value, onChange }) => (
		<div>
			<span data-testid="selected-topic">
				{value || "none"}
			</span>

			<button
				type="button"
				onClick={() => onChange("T123")}
			>
				Select mock topic
			</button>

			<button
				type="button"
				onClick={() => onChange("")}
			>
				Clear mock topic
			</button>
		</div>
	)
}));

vi.mock("../../src/components/search/SkeletonCard.jsx", () => ({
	default: () => (
		<div data-testid="skeleton-card">
			Loading Paper
		</div>
	)
}));

vi.mock("../../src/components/search/SearchPrompt.jsx", () => ({
	default: () => (
		<div>Start your search</div>
	)
}));

vi.mock("../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper, variant }) => (
		<article data-testid="paper-card">
			<span>{paper.title}</span>
			<span>{variant}</span>
		</article>
	)
}));

vi.mock("../../src/components/common/FetchError.jsx", () => ({
	default: ({ fetchError, retrySearchQuery }) => (
		<div>
			<p>{fetchError}</p>

			<button
				type="button"
				onClick={retrySearchQuery}
			>
				Retry
			</button>
		</div>
	)
}));


describe("SearchPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					totalResults: 2,
					papers: [
						{ id: 1, title: "Attention Is All You Need" },
						{ id: 2, title: "BERT" }
					]
				}
			})
		});

		window.scrollTo = vi.fn();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	
	// ---------- INITIAL RENDERING TESTS ----------

	it("Shows the search prompt when no search query exists", () => {
		// Create in-memory router which is suitable for the test environments
		// instead of running the actual BrowserRouter
		render(
			<MemoryRouter initialEntries={["/search"]}>
				<SearchPage />
			</MemoryRouter>
		);

		expect(screen.getByText("Start your search")).toBeInTheDocument();
		expect(globalThis.fetch).not.toHaveBeenCalled();
	});


	it("Performs a search when a query exists in the URL", async () => {
		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		// Wait for some time until the assertion is validated or fails
		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/api/search?"),
			{
				credentials: "include"
			}
		);
	});


	it("Includes the search query and default filters in the initial request", async () => {
		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);
		
		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const calls = globalThis.fetch.mock.calls;
		const url = calls[calls.length - 1][0];

		expect(url).toContain("machine+learning");
		expect(url).toContain("limit=25");
		expect(url).toContain("includeCount=true");
		expect(url).toContain("sort=relevance");
		expect(url).toContain("isOpenAccess=true");
		expect(url).toContain("isRetracted=false");
	});


	// ---------- SEARCH RESULTS TESTS ----------

	it("Renders papers returned by API", async () => {
		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		expect(await screen.findByText("Attention Is All You Need")).toBeInTheDocument();

		expect(screen.getByText("BERT")).toBeInTheDocument();

		expect(screen.getAllByTestId("paper-card")).toHaveLength(2);
	});


	it("Passes the search variant to paper cards", async () => {
		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		expect(await screen.findByText("Attention Is All You Need")).toBeInTheDocument();

		expect(screen.getAllByText("search")).toHaveLength(2);
	});


	it("Displays the returned total result count", async () => {
		// Keeping the papers as a preview of the 42 papers
		globalThis.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					totalResults: 42,
					papers: [
						{ id: 1, title: "Attention Is All You Need" },
						{ id: 2, title: "BERT" }
					]
				}
			})
		});

		const { container } = render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
            expect(container.querySelector("#total")).toHaveTextContent("42");
        });
	});


	// ---------- LOADING STATE TESTS ----------

	it("Renders five skeleton cards while the request is loading", async () => {
		globalThis.fetch.mockImplementation(() => new Promise(() => {}));

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => { expect(screen.getAllByTestId("skeleton-card")).toHaveLength(5); });
	});


	// ---------- ERRORS ----------

	it("Shows an error when the API request fails", async ()=> {
		globalThis.fetch.mockResolvedValue({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		expect(
			await screen.findByText("Could not reach the server. Check your connection and try again.")
		).toBeInTheDocument();
	});


	it("Shows an error when fetch rejects", async () => {
		globalThis.fetch.mockRejectedValue(new Error("Network failure"));

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		expect(
			await screen.findByText("Could not reach the server. Check your connection and try again.")
		).toBeInTheDocument();
	});


	it("Retries the search when Retry is clicked", async () => {
		const user = userEvent.setup();

		globalThis.fetch
			.mockResolvedValueOnce({ ok: false, status: 500 })
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({
					data: {
						totalResults: 2,
						papers: [
							{ id: 1, title: "Attention Is All You Need" },
							{ id: 2, title: "BERT" }
						]
					}
				})
			});

			
		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		const retryButton = await screen.findByRole("button", { name: /retry/i });
		await user.click(retryButton);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledTimes(2);
		});

		expect(await screen.findByText("Attention Is All You Need")).toBeInTheDocument();
	});


	// ---------- ACCESS FILTERS ----------

	it("Removes the open-access filter when Open access is disabled", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const button = screen.getByRole("button", { name: "Open access only" });
		await user.click(button);

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).not.toContain("isOpenAccess=true");
		});

		expect(screen.getByText("All access")).toBeInTheDocument();
	});


	it("Adds the PDF filter when PDF Available is enabled", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const button = screen.getByRole("button", { name: "PDF Available" });
		await user.click(button);

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("hasContentPDF=true");
		});

		expect(screen.getByText("PDF only")).toBeInTheDocument();
	});


	// ---------- PUBLICATION TYPE FILTER ----------

	it("Adds the selected publication type to the request", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		await user.click(screen.getByText("Journal article"));

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("paperType=article");
		});

		expect(screen.getByText("Journal article", { selector: ".pill" })).toBeInTheDocument();
	});


	// ---------- LANGUAGE FILTER ----------

	it("Adds the selected language to the request", async () => {
		const user = userEvent.setup();

		const { container } = render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const languageSelect = container.querySelector("#lang-dropdown");

		await user.selectOptions(languageSelect, "English");

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("language=English");
		});

		expect(languageSelect).toHaveValue("English");
	});


	// ---------- LANGUAGE FILTER ----------

	it("Shows an error for a year below the minimum year", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const input = screen.getByPlaceholderText("1800");
		await user.clear(input);
		await user.type(input, "1700");

		expect(screen.getByText("Min 1800")).toBeInTheDocument();
	});	


	it("Shows an error when the from year is greater than the to year", async () => {
		const user = userEvent.setup();

		const { container} = render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const yearInputs = container.querySelectorAll(".input-filter.years")
		
		await user.type(yearInputs[0], "2025");
		await user.type(yearInputs[1], "2020");

		expect(screen.getByText("From > To")).toBeInTheDocument();
	});	


	it("Does not perform another request when a filter is invalid", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const initialRequestCount = globalThis.fetch.mock.calls.length;

		const input = screen.getByPlaceholderText("1800");
		await user.type(input, "1700");

		await waitFor(() => {
			expect(screen.getByText("Min 1800")).toBeInTheDocument();
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(initialRequestCount);
	});


	// ---------- MINIMUM CITATIONS FILTER ----------

	it("Adds minimum citations to the API request", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const input = screen.getByPlaceholderText("e.g., 1000");
		await user.type(input, "500");

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("minCitations=500");
		});

		expect(screen.getByText("≥ 500 citations")).toBeInTheDocument();
	});	


	it("shows an error for negative minimum citations", async () => {

        render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

        const input = screen.getByPlaceholderText("e.g., 1000");

        fireEvent.change(input, {
            target: {
                value: "-5"
            }
        });

        expect(screen.getByText("Must be ≥ 0")).toBeInTheDocument();
    });


	// ---------- TOPICS FILTER ----------

	it("Adds the selected topic to the API request", async () => {
		const user = userEvent.setup();

        render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const button = screen.getByRole("button", { name: "Select mock topic" });
		await user.click(button);

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("topicId=T123");
		});

		expect(screen.getByText("Topic: T123")).toBeInTheDocument();
	});


	// ---------- RETRACTED PAPERS FIELD ----------

	it("Removes isRetracted=false when retracted papers are included", async () => {
		const user = userEvent.setup();

        render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const button = screen.getByRole("button", { name: "Include retracted" });
		await user.click(button);

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).not.toContain("isRetracted=false");
		});

		expect(screen.getByText("Including retracted")).toBeInTheDocument();
	});


	// ---------- SORTING FILTER ----------

	it("Requests citation sorting when citations is selected", async () => {
		const user = userEvent.setup();

        render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		const button = screen.getByRole("button", { name: "citations" });
		await user.click(button);

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("sort=citations");
		});

		expect(screen.getByText("Sort: citations")).toBeInTheDocument();
	});


	// ---------- PAGE SIZE FILTER ----------

	("Changes the number of results requested per page", async () => {
        const user = userEvent.setup();

        const { container } = render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

        await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

        const paginationSelect = container.querySelector("#pagination-overview select");

        await user.selectOptions(paginationSelect, "50");

        await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

            expect(url).toContain("limit=50");
            expect(url).toContain("page=1");
        });
    });


	// ---------- PAGINATION ----------

	it("Moves to the next results page", async () => {
		const user = userEvent.setup();

		// Keeping the papers as a preview of the 100 papers
		globalThis.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					totalResults: 100,
					papers: [
						{ id: 1, title: "Attention Is All You Need" },
						{ id: 2, title: "BERT" }
					]
				}
			})
		});

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await screen.findByText("Attention Is All You Need");

		const button = screen.getByRole("button", { name: /next/i });
		await user.click(button);

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

			expect(url).toContain("page=2");
			expect(url).toContain("includeCount=false");
		});

		expect(window.scrollTo).toHaveBeenCalledWith({
            top: 0,
            behavior: "smooth"
        });
	});


	it("Disables Previous on the first page", async () => {
        // Keeping the papers as a preview of the 100 papers
		globalThis.fetch.mockResolvedValue({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					totalResults: 100,
					papers: [
						{ id: 1, title: "Attention Is All You Need" },
						{ id: 2, title: "BERT" }
					]
				}
			})
		});

        render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

        const previous = await screen.findByRole("button", { name: /previous/i });

        expect(previous).toBeDisabled();
    });


	// ---------- CLEAR FILTERS ----------

	it("Clears all active filters", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/search?query=machine%20learning"]}>
				<SearchPage />
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalled();
		});

		// Activate a filter first
   		const pdfButton = screen.getByRole("button", { name: "PDF Available" });
		await user.click(pdfButton);
		
		expect(await screen.findByText("PDF only")).toBeInTheDocument();

		expect(pdfButton).toHaveAttribute("aria-pressed", "true");

		const clearButton = screen.getByRole("button", { name: "Clear all" });
		await user.click(clearButton);

		await waitFor(() => {
            expect(pdfButton).toHaveAttribute("aria-pressed", "false");
        });

		expect(screen.queryByText("PDF only")).not.toBeInTheDocument();

		await waitFor(() => {
			const calls = globalThis.fetch.mock.calls;
			const url = calls[calls.length - 1][0];

            expect(url).not.toContain("hasContentPDF=true");
            expect(url).toContain("isOpenAccess=true");
            expect(url).toContain("sort=relevance");
        });
	});

	
    // ---------- PREVENTING EMPTY QUERY ----------

    it("Does not apply filters without a search query", async () => {
        const user = userEvent.setup();

        render(
			<MemoryRouter initialEntries={["/search"]}>
				<SearchPage />
			</MemoryRouter>
		);

		expect(globalThis.fetch).not.toHaveBeenCalled();

		const button = screen.getByRole("button", { name: "PDF Available" });
        await user.click(button);

        expect(toastWarning).toHaveBeenCalledWith(
            "No search query",
            expect.objectContaining({
                description: "Enter a keyword in the search bar before applying filters",
				duration: 3000
            })
        );

        expect(globalThis.fetch).not.toHaveBeenCalled();

		expect(button).toHaveAttribute("aria-pressed", "false");
    });
});