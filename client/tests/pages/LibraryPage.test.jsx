import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import LibraryPage from "../../src/LibraryPage.jsx";


// Mocked modules and components
const mockUseAuth = vi.fn();

vi.mock("../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => mockUseAuth()
}));


vi.mock("../../src/components/library/FolderCard.jsx", () => ({
	default: ({ folder, onClick }) => (
		<button
			data-testid={`folder-card-${folder.id}`}
			onClick={onClick}
		>
			<span>{folder.name}</span>
			<span>{folder.summary}</span>
			<span>{folder.paperCount} papers</span>
		</button>
	)
}));


vi.mock("../../src/components/library/NewFolderModal.jsx", () => ({
	default: ({ onClose }) => (
		<div data-testid="new-folder-modal">
			<span>New Folder Modal</span>

			<button onClick={onClose}>
				Close New Folder Modal
			</button>
		</div>
	)
}));


vi.mock("../../src/components/library/FolderDetails.jsx", () => ({
	default: ({ folder, onClose }) => (
		<div data-testid="folder-details">
			<span>Folder Details: {folder.name}</span>

			<button onClick={onClose}>
				Close Folder Details
			</button>
		</div>
	)
}));


// Mock data
const mockUser = {
	id: 123,
	firstName: "John",
	lastName: "Doe"
};


const mockFolders = [
	{
		id: 1,
		name: "Machine Learning",
		summary: "Papers about neural networks and AI",
		color: "#2D6A4F",
		paperCount: 5,
		updatedAt: "2 days ago",
		papersPreview: []
	},
	{
		id: 2,
		name: "Databases",
		summary: "Database systems and query processing",
		color: "#3B5B92",
		paperCount: 3,
		updatedAt: "1 day ago",
		papersPreview: []
	},
	{
		id: 3,
		name: "Distributed Systems",
		summary: "Scalable distributed computing research",
		color: "#7A5A20",
		paperCount: 7,
		updatedAt: "Today",
		papersPreview: []
	}
];


describe("LibraryPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();

		mockUseAuth.mockReturnValue({
			user: mockUser,
			authLoading: false
		});
	});


	// ---------- AUTHENTICATION-RELATED TESTS ----------

	it("Displays the loading state while authentication is loading", () => {
		mockUseAuth.mockReturnValue({
			user: null,
			authLoading: true
		});

		// Current LibraryPage still executes loadFolders()
		// on mount, even while auth is loading.
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		expect(screen.getByText("Loading profile...")).toBeInTheDocument();
	});


	it("Renders nothing when the user is unauthenticated", () => {
		mockUseAuth.mockReturnValue({
			user: null,
			authLoading: false
		});

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		const { container } = render(<LibraryPage />);

		expect(container).toBeEmptyDOMElement();
	});


	// ---------- FOLDER FETCHING TESTS ----------

	it("Fetches the authenticated user's folders", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await waitFor(() => {
			expect(globalThis.fetch).toHaveBeenCalledWith(
				"/api/users/me/folders",
				{
					credentials: "include"
				}
			);
		});

		expect(globalThis.fetch).toHaveBeenCalledTimes(1);
	});


	it("Displays the folders returned by the API", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		expect(await screen.findByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Databases")).toBeInTheDocument();
		expect(screen.getByText("Distributed Systems")).toBeInTheDocument();
		expect(screen.getAllByTestId(/^folder-card-/)).toHaveLength(3);
	});


	it("Handles failure to fetch folders", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		globalThis.fetch.mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		render(<LibraryPage />);

		await waitFor(() => {
			expect(consoleSpy).toHaveBeenCalledWith(
				"Failed to fetch user folders:",
				expect.any(Error)
			);
		});

		expect(screen.getByText('No collections match ""')).toBeInTheDocument();

		consoleSpy.mockRestore();
	});


	// ---------- HEADER RENDERING TESTS ----------

	it("Displays the authenticated user's information", () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		expect(screen.getByText("John Doe • @John_Doe")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "My Library" })).toBeInTheDocument();
	});


	it("Displays the number of collections and total papers", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		expect(await screen.findByText("3 collections • 15 papers")).toBeInTheDocument();
	});


	it("Displays zero totals when no folders exist", async () => {
		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: []
				}
			})
		});

		render(<LibraryPage />);

		expect(await screen.findByText("0 collections • 0 papers")).toBeInTheDocument();
	});


	// ---------- FILTERING TESTS ----------

	it("Filters folders by folder name", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		const filterInput = screen.getByPlaceholderText("Filter folders...");
		await user.type(filterInput, "database");

		expect(screen.getByText("Databases")).toBeInTheDocument();
		expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();
		expect(screen.queryByText("Distributed Systems")).not.toBeInTheDocument();
	});


	it("Filters folders by folder summary", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		const filterInput =screen.getByPlaceholderText("Filter folders...");
		await user.type(filterInput, "query processing");

		expect(screen.getByText("Databases")).toBeInTheDocument();
		expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();
		expect(screen.queryByText("Distributed Systems")).not.toBeInTheDocument();
	});


	it("Filters folders case-insensitively", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		await user.type(screen.getByPlaceholderText("Filter folders..."), "MACHINE LEARNING");

		expect(screen.getByText("Machine Learning")).toBeInTheDocument();
		expect(screen.queryByText("Databases")).not.toBeInTheDocument();
	});


	it("Displays a message when no folders match the filter", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		await user.type(screen.getByPlaceholderText("Filter folders..."),"quantum physics");

		expect(screen.getByText('No collections match "quantum physics"')).toBeInTheDocument();

		expect(screen.queryByTestId("folder-card-1")).not.toBeInTheDocument();
		expect(screen.queryByTestId("folder-card-2")).not.toBeInTheDocument();
		expect(screen.queryByTestId("folder-card-3")).not.toBeInTheDocument();
	});


	it("Restores all folders when the filter is cleared", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		const filterInput = screen.getByPlaceholderText("Filter folders...");

		await user.type(filterInput, "database");

		expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();

		await user.clear(filterInput);

		expect(screen.getByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Databases")).toBeInTheDocument();
		expect(screen.getByText("Distributed Systems")).toBeInTheDocument();
	});


	// ---------- NEW FOLDER MODAL TESTS ----------

	it("Opens the new folder modal", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await user.click(screen.getByRole("button", { name: /New Folder/i }));

		expect(screen.getByTestId("new-folder-modal")).toBeInTheDocument();
	});


	it("Closes the new folder modal", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await user.click(screen.getByRole("button", { name: /New Folder/i }));

		expect(screen.getByTestId("new-folder-modal")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Close New Folder Modal" }));

		expect(screen.queryByTestId("new-folder-modal")).not.toBeInTheDocument();
	});


	// ---------- FOLDER DETAILS PANEL TESTS ----------

	it("Opens folder details when a folder is selected", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		const folder = await screen.findByTestId("folder-card-1");

		await user.click(folder);

		expect(screen.getByTestId("folder-details")).toBeInTheDocument();

		expect(screen.getByText("Folder Details: Machine Learning")).toBeInTheDocument();
	});


	it("Opens the details for the selected folder", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByTestId("folder-card-2"));

		expect(screen.getByText("Folder Details: Databases")).toBeInTheDocument();

		expect(screen.queryByText("Folder Details: Machine Learning")).not.toBeInTheDocument();
	});


	it("Closes the selected folder details", async () => {
		const user = userEvent.setup();

		globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: {
					folders: mockFolders
				}
			})
		});

		render(<LibraryPage />);

		await screen.findByText("Machine Learning");

		await user.click(screen.getByTestId("folder-card-1"));

		expect(screen.getByTestId("folder-details")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "Close Folder Details" }));

		expect(screen.queryByTestId("folder-details")).not.toBeInTheDocument();
	});
});