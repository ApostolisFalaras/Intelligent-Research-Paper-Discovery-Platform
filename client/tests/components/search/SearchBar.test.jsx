import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SearchBar from "../../../src/components/search/SearchBar.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate
}));


describe("SearchBar", () => {
	beforeEach(() => {
        mockNavigate.mockClear();
    });

	// ---------- RENDERING TESTS ----------

	it("Renders the search input and button", () => {
		render(<SearchBar variant="navbar" />);

		expect(screen.getByPlaceholderText("Search papers, authors, topics...")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /search/i }));
	});

	it("Applies the provided variant classes", () => {
		const { container } = render(
			<SearchBar variant="navbar" />
		);

		expect(container.querySelector(".search-bar-navbar")).toBeInTheDocument();
		expect(container.querySelector(".search-input-navbar")).toBeInTheDocument();
		expect(container.querySelector(".search-button-navbar")).toBeInTheDocument();
	});


	// ---------- USER INPUT TESTS ----------

	it("Updates the input as the user types", async () => {
		const user = userEvent.setup();

		render(<SearchBar variant="navbar" />);

		const input = screen.getByPlaceholderText("Search papers, authors, topics...");

		await user.type(input, "machine learning");

		expect(input).toHaveValue("machine learning");
	});

	
	it("Navigates to the search page when Search is clicked", async () => {
		const user = userEvent.setup();

		render(<SearchBar variant="navbar" />);

		const input = screen.getByPlaceholderText("Search papers, authors, topics...");
		await user.type(input, "machine learning");

		const button = screen.getByRole("button", { name: /search/i });
		await user.click(button);

		expect(mockNavigate).toHaveBeenCalledWith("/search?query=machine%20learning");
		expect(mockNavigate).toHaveBeenCalledTimes(1);
	});


	it("Navigates when Enter is pressed", async () => {
		const user = userEvent.setup();

		render(<SearchBar variant="navbar" />);

		const input = screen.getByPlaceholderText("Search papers, authors, topics...");
		await user.type(input, "transformers");

		await user.keyboard("{Enter}");

		expect(mockNavigate).toHaveBeenCalledWith("/search?query=transformers");
		expect(mockNavigate).toHaveBeenCalledTimes(1);
	});


	it("URL-encodes special characters in the search query", async () => {
		const user = userEvent.setup();

		render(<SearchBar variant="navbar" />);

		const input = screen.getByPlaceholderText("Search papers, authors, topics...");
		await user.type(input, "AI & medicine");

		await user.keyboard("{Enter}");

		expect(mockNavigate).toHaveBeenCalledWith(`/search?query=${encodeURIComponent("AI & medicine")}`);
		expect(mockNavigate).toHaveBeenCalledTimes(1);
	});

	
	// ---------- USER INPUT ERRORS ----------

	it("Doesn't navigate when the query is empty", async () => {
		const user = userEvent.setup();

		render(<SearchBar variant="navbar" />);

		const button = screen.getByRole("button", { name: /search/i });
		await user.click(button);

		expect(mockNavigate).not.toHaveBeenCalled();
	});


	it("Doesn't navigate when the query contains only whitespace", async () => {
		const user = userEvent.setup();

		render(<SearchBar variant="navbar" />);

		const input = screen.getByPlaceholderText("Search papers, authors, topics...");
		await user.type(input, "    ");

		await user.keyboard("{Enter}");

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	
});