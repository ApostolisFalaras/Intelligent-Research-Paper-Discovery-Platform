

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import FollowingAuthors from "../../../src/components/authors/FollowingAuthors.jsx";


const mockAuthors = [
	{
		id: "A1",
		internalId: "101",
		authorName: "Geoffrey Hinton",
		createdAt: "2026-09-21T13:03:04.698Z"
	},
	{
		id: "A2",
		internalId: "102",
		authorName: "Yann LeCun",
		createdAt: "2026-09-20T13:03:04.698Z"
	},
	{
		id: "A3",
		internalId: "103",
		authorName: "Yoshua Bengio",
		createdAt: "2026-09-19T13:03:04.698Z"
	},
	{
		id: "A4",
		internalId: "104",
		authorName: "Fei-Fei Li",
		createdAt: "2026-09-18T13:03:04.698Z"
	},
	{
		id: "A5",
		internalId: "105",
		authorName: "Andrew Ng",
		createdAt: "2026-09-17T13:03:04.698Z"
	}
];


describe("FollowingAuthors", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});


	it("Displays the number of followed authors", () => {
		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		expect(screen.getByText("5")).toBeInTheDocument();
	});


	it("Displays the empty state when no authors are followed", () => {
		render(
			<MemoryRouter>
				<FollowingAuthors authors={[]} />
			</MemoryRouter>
		);

		expect(screen.getByText("No followed authors yet.")).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /See all/i })).not.toBeInTheDocument();
	});


	it("Displays only the first three authors in the collapsed preview", () => {
		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		expect(screen.getByText("Geoffrey Hinton")).toBeInTheDocument();
		expect(screen.getByText("Yann LeCun")).toBeInTheDocument();
		expect(screen.getByText("Yoshua Bengio")).toBeInTheDocument();
		expect(screen.queryByText("Fei-Fei Li")).not.toBeInTheDocument();
		expect(screen.queryByText("Andrew Ng")).not.toBeInTheDocument();
	});


	it("Displays the number of hidden authors in collapsed mode", () => {
		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		expect(screen.getByText("+2 more")).toBeInTheDocument();
	});


	it("Generates initials for authors in the collapsed preview", () => {
		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		expect(screen.getByText("GH")).toBeInTheDocument();
		expect(screen.getByText("YL")).toBeInTheDocument();
		expect(screen.getByText("YB")).toBeInTheDocument();
	});


	it("Links authors to their author pages", () => {
		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		expect(screen.getByRole("link", { name: "Geoffrey Hinton"}))
			.toHaveAttribute("href", "/authors/A1");
	});


	it("Opens the full authors list when See all is clicked", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		expect(screen.getByPlaceholderText("Search…")).toBeInTheDocument();
		expect(screen.getByText("Fei-Fei Li")).toBeInTheDocument();
		expect(screen.getByText("Andrew Ng")).toBeInTheDocument();

		expect(screen.getByRole("button", { name: /Done/i })).toBeInTheDocument();
	});


	it("Filters authors using the search input", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		const searchInput = screen.getByPlaceholderText("Search…");

		await user.type(searchInput, "Andrew");

		expect(screen.getByText("Andrew Ng")).toBeInTheDocument();
		expect(screen.queryByText("Geoffrey Hinton")).not.toBeInTheDocument();
		expect(screen.queryByText("Yann LeCun")).not.toBeInTheDocument();
	});


	it("Filters authors case-insensitively", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.type(screen.getByPlaceholderText("Search…"), "andrew");

		expect(screen.getByText("Andrew Ng")).toBeInTheDocument();
	});


	it("Ignores surrounding whitespace in the search query", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.type(screen.getByPlaceholderText("Search…"), "  Andrew  ");

		expect(screen.getByText("Andrew Ng")).toBeInTheDocument();
	});


	it("Displays a message when no authors match the search", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.type(screen.getByPlaceholderText("Search…"), "Unknown");

		expect(screen.getByText('No results for "Unknown"')).toBeInTheDocument();
	});


	it("Closes the expanded list when Done is clicked", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.click(screen.getByRole("button", { name: /Done/i }));

		expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();

		expect(screen.getByRole("button", { name: /See all/i })).toBeInTheDocument();
	});


	it("Clears the search when the expanded list is closed and reopened", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.type(screen.getByPlaceholderText("Search…"), "Andrew");

		await user.click(screen.getByRole("button", { name: /Done/i }));
		await user.click(screen.getByRole("button", { name: /See all/i }));

		expect(screen.getByPlaceholderText("Search…")).toHaveValue("");

		expect(screen.getByText("Geoffrey Hinton")).toBeInTheDocument();
	});


	it("Closes the expanded list when an author link is selected", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<FollowingAuthors authors={mockAuthors} />
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.click(screen.getByRole("link", { name: "Geoffrey Hinton" }));

		expect(screen.queryByPlaceholderText("Search…")).not.toBeInTheDocument();
	});


	it("Calls onUnfollow with the author id when the unfollow button is clicked", async () => {
		const user = userEvent.setup();
		const mockOnUnfollow = vi.fn();

		render(
			<MemoryRouter>
				<FollowingAuthors
					authors={mockAuthors}
					onUnfollow={mockOnUnfollow}
				/>
			</MemoryRouter>
		);

		await user.click(screen.getByRole("button", { name: /See all/i }));

		await user.click(
			screen.getByRole("button", {
				name: "Unfollow Geoffrey Hinton"
			})
		);

		expect(mockOnUnfollow).toHaveBeenCalledTimes(1);
		expect(mockOnUnfollow).toHaveBeenCalledWith("A1");
	});
});