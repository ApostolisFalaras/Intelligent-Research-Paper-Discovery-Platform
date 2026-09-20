import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import FolderDetails from "../../../src/components/library/FolderDetails.jsx";

// Mocking inner component
vi.mock("../../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper, variant }) => (
		<div data-testid="paper-card">
			<span>{paper.title}</span>
			<span>{variant}</span>
		</div>
	)
}));

// Mock data
const mockFolder = {
	id: 10,
	name: "Machine Learning",
	summary: "Machine learning research papers.",
	color: "#2D6A4F",
	paperCount: 2,
	updatedAt: "2 days ago"
};


const mockPapers = [
	{ id: "W1", title: "Deep Learning Paper" },
	{ id: "W2", title: "Neural Networks Paper" }
];

describe("FolderDetails", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		global.fetch = vi.fn();
	});


	// ---------- RENDERING TESTS ----------

	it("Displays the folder information", () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		expect(screen.getByRole("heading", { name: "Machine Learning" })).toBeInTheDocument();
		expect(screen.getByText("Machine learning research papers.")).toBeInTheDocument();
		expect(screen.getByText("2 papers")).toBeInTheDocument();
		expect(screen.getByText("Updated 2 days ago")).toBeInTheDocument();
	});


	it("Fetches the papers belonging to the folder", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockPapers
			})
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				"/api/users/me/folders/10/papers",
				{
					credentials: "include"
				}
			);
		});

		expect(global.fetch).toHaveBeenCalledTimes(1);
	});


	it("Displays the papers returned by the API", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockPapers
			})
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		expect(await screen.findByText("Deep Learning Paper")).toBeInTheDocument();

		expect(screen.getByText("Neural Networks Paper")).toBeInTheDocument();

		expect(screen.getAllByTestId("paper-card")).toHaveLength(2);
	});


	it("Renders folder papers using the folder PaperCard variant", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockPapers
			})
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		await screen.findByText("Deep Learning Paper");

		const paperCards = screen.getAllByTestId("paper-card");

		paperCards.forEach((card) => { expect(card).toHaveTextContent("folder"); });
	});


	it("Displays the empty state when the folder contains no papers", async () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		expect(
			await screen.findByText(
				"This folder is empty.",
				{
					exact: false
				}
			)
		).toBeInTheDocument();

		expect(screen.getByText("Save papers from search to add them here.")).toBeInTheDocument();
	});


	it("Handles failure to fetch folder papers", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		global.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch folder data:",
				expect.any(Error)
			);
		});

		expect(
			screen.getByText(
				"This folder is empty.",
				{
					exact: false
				}
			)
		).toBeInTheDocument();

		consoleSpy.mockRestore();
	});


	it("Calls onClose when the close button is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		const { container } = render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={onClose}
				/>
			</MemoryRouter>
		);

		await user.click(container.querySelector("#close-folder-panel"));

		expect(onClose).toHaveBeenCalledTimes(1);
	});


	it("Calls onClose when the panel backdrop is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		const { container } = render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={onClose}
				/>
			</MemoryRouter>
		);

		await user.click(container.querySelector("#folder-panel"));

		expect(onClose).toHaveBeenCalledTimes(1);
	});


	it("Does not close when the inner panel is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();

		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		const { container } = render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={onClose}
				/>
			</MemoryRouter>
		);

		const panel = container.querySelector("#folder-panel");
		await user.click(panel.firstElementChild);

		expect(onClose).not.toHaveBeenCalled();
	});


	it("Links the Add Papers button to the search page", () => {
		global.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: []
			})
		});

		render(
			<MemoryRouter>
				<FolderDetails
					folder={mockFolder}
					onClose={vi.fn()}
				/>
			</MemoryRouter>
		);

		expect(screen.getByRole("link", { name: /Add Papers/i }))
			.toHaveAttribute("href", "/search");
	});

});