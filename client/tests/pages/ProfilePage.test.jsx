import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import ProfilePage from "../../src/ProfilePage.jsx";


// Mocking modules and inner components
const mockUseAuth = vi.fn();

vi.mock("../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => mockUseAuth()
}));

vi.mock("../../src/components/papers/PaperCard.jsx", () => ({
    default: ({ paper, variant }) => (
        <div data-testid="paper-card">
            <span>{paper.title}</span>
            <span>{variant}</span>
        </div>
    )
}));

vi.mock("../../src/components/authors/FollowingAuthors.jsx", () => ({
    default: ({ authors }) => (
        <div data-testid="following-authors">
            {authors?.map((author) => (
                <span key={author.id}>
                    {author.displayName}
                </span>
            ))}
        </div>
    )
}));


// Mock data
const mockUser = {
    userId: 123,
    firstName: "John",
    lastName: "Doe",
    affiliation: "MIT",
    location: "Boston",
    role: "Research Scientist",
    bio: "Machine learning researcher",
    avatarURL: null
};

const mockProfileInfo = {
    totalViewedPapers: 25,
    totalSavedPapers: 12,
    totalFolders: 4,

    previewViewedPapers: [
        { id: "W1", title: "Recently Viewed Paper One" },
        { id: "W2", title: "Recently Viewed Paper Two" }
    ],

    previewSavedPapers: [
        { id: "W3", title: "Saved Paper One" },
        { id: "W4", title: "Saved Paper Two" }
    ],

    previewFolders: [
        { id: 1, name: "Machine Learning", paperCount: 5, color: "#123456" },
        { id: 2, name: "Databases", paperCount: 3, color: "#654321" }
    ],
    authorsFollowed: [
        { id: "A1", displayName: "Jane Smith" },
        { id: "A2", displayName: "Robert Brown" }
    ],
    researchTopics: [
        { id: "T1", name: "Machine Learning" },
        { id: "T2", name: "Databases" }
    ]
};


describe("ProfilePage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();

		mockUseAuth.mockReturnValue({
			user: mockUser,
			authLoading: false
		});
	});


	// ---------- AUTHENTICATION TESTS ----------

	it("Displays the loading state while authentication is loading", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            authLoading: true
        });
		
        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByText("Loading profile...")).toBeInTheDocument();

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });


	 it("Renders nothing when the user is unauthenticated", () => {
        mockUseAuth.mockReturnValue({
            user: null,
            authLoading: false
        });

        const { container } = render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(container).toBeEmptyDOMElement();
        expect(globalThis.fetch).not.toHaveBeenCalled();
    });


	// ---------- PROFILE FETCHING TESTS ----------

	it("Fetches the authenticated user's profile information", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/users/me/profile",
                {
                    credentials: "include",
                    cache: "no-store"
                }
            );
        });

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });


	it("Handles failure to fetch profile information", async () => {
        const consoleSpy = vi.spyOn(console, "error") .mockImplementation(() => {});

        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch profile info:", expect.any(Error));
        });

        expect(screen.getByText("John Doe")).toBeInTheDocument();

        consoleSpy.mockRestore();
    });


	// ---------- PROFILE HEADER TESTS ----------

	it("Displays the user's profile information", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByRole("heading", { name: "John Doe" })).toBeInTheDocument();

        expect(screen.getByText("@John_Doe")).toBeInTheDocument();

        expect(screen.getByText("MIT")).toBeInTheDocument();

        expect(screen.getByText("Boston")).toBeInTheDocument();

        expect(screen.getByText("Research Scientist")).toBeInTheDocument();

        expect(screen.getByText("Machine learning researcher")).toBeInTheDocument();
    });


	it("Displays the user's initials when no avatar exists", () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByText("JD")).toBeInTheDocument();

        expect(screen.queryByRole("img", { name: "Profile" })).not.toBeInTheDocument();
    });


    it("Displays the user's avatar when one exists", () => {
        mockUseAuth.mockReturnValue({
            user: {
                ...mockUser,
                avatarURL: "/uploads/avatar.jpg"
            },
            authLoading: false
        });

        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByRole("img", { name: "Profile" }))
			.toHaveAttribute("src", "/uploads/avatar.jpg");

        expect(screen.queryByText("JD")).not.toBeInTheDocument();
    });


	it("Displays fallback values for missing optional profile information", () => {
        mockUseAuth.mockReturnValue({
            user: {
                ...mockUser,
                affiliation: null,
                location: null,
                role: null,
                bio: null
            },
            authLoading: false
        });

        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        const { container } = render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(container.querySelector("#user-affiliation")).toHaveTextContent("-");

        expect(container.querySelector("#user-location")).toHaveTextContent("-");

        expect(container.querySelector("#user-role")).toHaveTextContent("-");

        expect(container.querySelector("#user-bio")).toHaveTextContent("-");
    });


    it("Links to the account settings page", () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByRole("link", { name: /Edit Profile/i }))
			.toHaveAttribute("href", "/account-settings");
    });


	// ---------- STATISTICS TEST ----------

	it("Displays the user's profile statistics", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(screen.getByText("25")).toBeInTheDocument();
        });

        expect(screen.getByText("Viewed papers")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();

        expect(screen.getByText("Saved papers")).toBeInTheDocument();
        expect(screen.getByText("4")).toBeInTheDocument();

        expect(screen.getByText("Collections")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();

        expect(screen.getByText("Following")).toBeInTheDocument();
    });


	// ---------- RECENT ACTIVITY TESTS ----------

	it("Displays recently viewed papers by default", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByRole("heading", { name: "Recently Viewed" })).toBeInTheDocument();

        expect(await screen.findByText("Recently Viewed Paper One")).toBeInTheDocument();

        expect(screen.getByText("Recently Viewed Paper Two")).toBeInTheDocument();

        expect(screen.queryByText("Saved Paper One")).not.toBeInTheDocument();
    });


    it("Renders recently viewed papers using the profile PaperCard variant", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await screen.findByText("Recently Viewed Paper One");

        const cards = screen.getAllByTestId("paper-card");
        
		expect(cards).toHaveLength(2);

        cards.forEach((card) => { expect(card).toHaveTextContent("profile"); });
    });


	// ---------- SAVED PAPERS TEST ----------

	it("Displays saved papers when the Saved Papers tab is selected", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "saved papers" }));

        expect(screen.getByRole("heading", { name: "Saved Papers" })).toBeInTheDocument();

        expect(await screen.findByText("Saved Paper One")).toBeInTheDocument();

        expect(screen.getByText("Saved Paper Two")).toBeInTheDocument();

        expect(screen.queryByText("Recently Viewed Paper One")).not.toBeInTheDocument();
    });


	// ---------- ABOUT ----------

	it("Displays research topics in the About tab", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "about" }));

		expect(screen.getByRole("heading", { name: "Research interests" })).toBeInTheDocument();

		const topicContainer = document.querySelector("#topic-pills");

		expect(within(topicContainer).getByText("Machine Learning")).toBeInTheDocument();

		expect(within(topicContainer).getByText("Databases")).toBeInTheDocument();
    });


    it("Displays the user's affiliation in the About tab", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button", { name: "about" }));

		expect(screen.getByRole("heading", { name: "Affiliation" })).toBeInTheDocument();

		expect(document.querySelector("#affiliation-description")).toHaveTextContent("MIT");
    });


	// ---------- LIBRARY SIDEBAR ----------

	it("Displays preview collections in the library sidebar", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(await screen.findByText("Machine Learning")).toBeInTheDocument();

        expect(screen.getByText("5 papers")).toBeInTheDocument();

        expect(screen.getByText("Databases")).toBeInTheDocument();

        expect(screen.getByText("3 papers")).toBeInTheDocument();
    });


    it("Links the library shortcut to My Library", () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(screen.getByRole("link", { name: /View All/i }))
			.toHaveAttribute("href", "/my-library");
    });


	// ---------- FOLLOWING AUTHORS TEST ----------

    it("Passes followed authors to FollowingAuthors", async () => {
        globalThis.fetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: vi.fn().mockResolvedValue({
				data: mockProfileInfo
			})
		});

        render(
			<MemoryRouter>
				<ProfilePage />
			</MemoryRouter>
		);

        expect(await screen.findByText("Jane Smith")).toBeInTheDocument();

        expect(screen.getByText("Robert Brown")).toBeInTheDocument();

        expect(screen.getByTestId("following-authors")).toBeInTheDocument();
    });
});