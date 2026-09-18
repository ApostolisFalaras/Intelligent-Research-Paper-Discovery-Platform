import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PaperPage from "../../src/PaperPage.jsx";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mocking used elements and modules
const mockUseAuth = vi.fn();
const toastSuccess = vi.fn();

vi.mock("../../src/hooks/useAuth.jsx", () => ({
    useAuth: () => mockUseAuth()
}));

vi.mock("sonner", () => ({
	toast: {
		success: (...args) => toastSuccess(...args)
	}
}));

vi.mock("../../src/components/papers/OABadge.jsx", () => ({
	default: ({ status }) => (
		<div data-testid="oa-badge">
			{status}
		</div>
	)
}));

vi.mock("../../src/components/papers/StatsCard.jsx", () => ({
	default: ({ label, value, sublabel }) => (
		<div data-testid="stats-card">
			<span>{label}</span>
			<span>{value}</span>
			<span>{sublabel}</span>
		</div>
	)
}));

vi.mock("../../src/components/papers/PaperModal.jsx", () => ({
	default: ({ paperTitle, onClose, onSaved }) => (
		<div data-testid="paper-modal">
			<span>{paperTitle}</span>

			<button type="button" onClick={onClose}>
				Close modal
			</button>

			<button type="button" onClick={() => onSaved({ isSaved: true, folderIds: [1, 2] })}>
				Mock save
			</button>

			<button type="button" onClick={() => onSaved({ isSaved: false, folderIds: [] })}>
				Mock unsave
			</button>
		</div>
	)
}));


// Mock Simplified Version of a Paper -- DOESN'T EXIST IN THE DATASET
const mockPaper = {
    id: "W123456",
    internalId: 42,
    title: "Deep Learning for Scientific Discovery",
    displayName: "Deep Learning for Scientific Discovery",
    abstract: "This paper investigates deep learning methods for scientific discovery.",
    doi: "https://doi.org/10.1234/example",
    publication: {
        type: "article",
        date: "2025-05-10",
        year: 2025,
        language: "English"
    },
    source: {
        name: "Nature",
        volume: "15",
        pages: "100-120"
    },
    access: {
        status: "gold",
        isOpenAccess: true,
        hasPDF: true,
        bestURL: "https://example.com/paper.pdf"
    },
    metrics: {
        citedByCount: 1250,
        fwci: 2.34,
        citationPercentile: 0.97,
        referencedWorksCount: 54,
        top1Percent: true
    },
    flags: {
        isRetracted: false
    },
    topic: {
        domain: "Physical Sciences",
        field: "Computer Science",
        subfield: "Artificial Intelligence",
        name: "Machine Learning"
    },
    authors: [
        {
            id: "A1",
            displayName: "John Smith",
            authorExists: true,
            affiliations: [
                {
                    rawString: "MIT"
                }
            ],
            institutions: [
                {
                    id: "I1",
                    countryCode: "US"
                }
            ]
        },
        {
            id: "A2",
            displayName: "Jane Doe",
            authorExists: true,
            affiliations: [
                {
                    rawString: "University of Oxford"
                }
            ],
            institutions: [
                {
                    id: "I2",
                    countryCode: "GB"
                }
            ]
        }
    ],
    indexedIn: [
        "Crossref",
        "PubMed"
    ],
    isSaved: false
};



describe("PaperPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		global.fetch = vi.fn();

		mockUseAuth.mockReturnValue({
			user: {
				id: 123,
				username: "johndoe"
			}
		});
	});


	// ---------- PAPER FETCHING TESTS ----------

	it("Fetches the paper using the route parameter", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

	
		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/papers/W123456",
                {
                    credentials: "include"
                }
            );
        });
    });


	it("Records a paper view after successfully loading the paper", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

	
		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                "/api/papers/42/view",
                {
                    method: "POST",
                    credentials: "include"
                }
            );
        });

        expect(global.fetch).toHaveBeenCalledTimes(2);
    });


	it("Does not record a paper view when loading the paper fails", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        global.fetch.mockResolvedValue({
            ok: false,
            status: 404
        });

        render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        expect(global.fetch).not.toHaveBeenCalledWith(
            expect.stringContaining("/view"),
            expect.anything()
        );

        consoleSpy.mockRestore();
    });


	// ---------- PAPER INFORMATION RENDERING TESTS ----------

	it("Displays the main paper information", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        expect(await screen.findByRole("heading", { name: "Deep Learning for Scientific Discovery" }))
			.toBeInTheDocument();

        expect(screen.getAllByText("article").length).toBeGreaterThan(0);

        expect(screen.getAllByText("Nature").length).toBeGreaterThan(0);

        expect(screen.getAllByText("2025").length).toBeGreaterThan(0);

        expect(screen.getByText("2025-05-10")).toBeInTheDocument();

        expect(screen.getByText("Vol. 15, pp. 100-120")).toBeInTheDocument();
    });


	it("Displays the Top 1% badge when applicable", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        expect(await screen.findByText("Top 1%")).toBeInTheDocument();
    });


	it("Displays the retracted warning for a retracted paper", async () => {
		global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ 
					data: { 
						...mockPaper,
						flags: {
							...mockPaper.flags,
							isRetracted: true
						}
					}
				})
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});


        render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        expect(await screen.findByText("Retracted")).toBeInTheDocument();
    });


	// ---------- AUTHOR INFORMATION RENDERING TESTS ----------

	it("Displays the paper authors", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await screen.findByRole("heading", { name: "Deep Learning for Scientific Discovery" });

        expect(screen.getAllByText("John Smith").length).toBeGreaterThan(0);

        expect(screen.getAllByText("Jane Doe").length).toBeGreaterThan(0);

        expect(screen.getByRole("heading", { name: "Authors (2)" })).toBeInTheDocument();
    });


	it("Links existing authors to their author pages", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await screen.findByRole("heading", { name: "Deep Learning for Scientific Discovery" });

        const johnLinks = screen.getAllByRole("link", { name: /John Smith/i });

        expect(johnLinks.some((link) => link.getAttribute("href") === "/authors/A1")).toBe(true);
    });


	// ---------- EXTERNAL PAPER LINKS TESTS ----------

	it("Displays the Read Paper link for an open-access paper", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        const readPaper = await screen.findByRole("link", { name: /Read Paper/i });

        expect(readPaper).toHaveAttribute("href", "https://example.com/paper.pdf");

        expect(readPaper).toHaveAttribute("target", "_blank");
    });


    it("Does not display Read Paper when the paper is not open access", async () => {
		global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ 
					data: {
						...mockPaper,
						access: {
							...mockPaper.access,
							isOpenAccess: false
						}
					} 
				})
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

        render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await screen.findByRole("heading", { name: "Deep Learning for Scientific Discovery" });

        expect(screen.queryByRole("link", { name: /Read Paper/i })).not.toBeInTheDocument();
    });


    it("Displays the DOI link when a DOI exists", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        const doiLink = await screen.findByRole("link", { name: /DOI/i });

        expect(doiLink).toHaveAttribute("href", "https://doi.org/10.1234/example");
    });


	// ---------- ABSTRACT TESTS ----------

	it("Displays a short abstract without an expansion button", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        expect(await screen.findByText(mockPaper.abstract)).toBeInTheDocument();

        expect(screen.queryByRole("button", { name: "Read full abstract" })).not.toBeInTheDocument();
    });


    it("Truncates and expands a long abstract", async () => {
        const user = userEvent.setup();
        const longAbstract = "A".repeat(400);

        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ 
					data: {
						...mockPaper,
						abstract: longAbstract
					}
				})
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await screen.findByRole("heading", { name: "Deep Learning for Scientific Discovery" });

        expect(screen.getByText(`${"A".repeat(320)}...`)).toBeInTheDocument();

        const expandButton = screen.getByRole("button", { name: "Read full abstract" });
        await user.click(expandButton);

        expect(screen.getByText(longAbstract)).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Show less" }));

        expect(screen.getByText(`${"A".repeat(320)}...`)).toBeInTheDocument();
    });

    
	// ---------- CLASSIFICATION TEST ----------
    
    it("Displays the research classification", async () => {
        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await screen.findByText("Deep Learning for Scientific Discovery");

        expect(screen.getByText("Physical Sciences")).toBeInTheDocument();
        expect(screen.getByText("Computer Science")).toBeInTheDocument();
        expect(screen.getByText("Artificial Intelligence")).toBeInTheDocument();
        expect(screen.getByText("Machine Learning")).toBeInTheDocument();
    });


    // ---------- PAPER REACH TEST ----------

    it("Calculates unique countries and institutions", async () => {
		global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		const { container } = render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await screen.findByText("Deep Learning for Scientific Discovery");

        expect(container.querySelector(".countries")).toHaveTextContent("2");
        expect(container.querySelector(".institutions")).toHaveTextContent("2");
    });


    // ---------- SAVE FUNCTIONALITY / PAPER MODAL TESTS ----------

    it("Disables saving for unauthenticated users", async () => {
        mockUseAuth.mockReturnValue({ user: null });

        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        const saveButton = await screen.findByRole("button", { name: "Save" });
        expect(saveButton).toBeDisabled();
    });


    it("Opens the save modal when an authenticated user clicks Save", async () => {
        const user = userEvent.setup();

        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await user.click(await screen.findByRole("button", { name: "Save" }));

        expect(screen.getByTestId("paper-modal")).toBeInTheDocument();
        expect(screen.getByTestId("paper-modal")).toHaveTextContent("Deep Learning for Scientific Discovery");
    });


    it("Closes the save modal", async () => {
        const user = userEvent.setup();

        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await user.click(await screen.findByRole("button", { name: "Save" }));

        await user.click(screen.getByRole("button", { name: "Close modal" }));

        expect(screen.queryByTestId("paper-modal")).not.toBeInTheDocument();
    });


    it("Updates the paper to Saved after saving it in collections", async () => {
        const user = userEvent.setup();

        global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ data: mockPaper })
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await user.click(await screen.findByRole("button", { name: "Save" }));

        await user.click(screen.getByRole("button", { name: "Mock save" }));

        expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();

        expect(toastSuccess).toHaveBeenCalledWith(
            "Saved in 2 collections",
            {
                duration: 2800
            }
        );
    });


    it("Updates the paper to Save after removing it from all collections", async () => {
        const user = userEvent.setup();

		global.fetch
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: vi.fn().mockResolvedValue({ 
					data: { 
						...mockPaper,
						isSaved: true 
					} 
				})
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200
			});

		render(
			<MemoryRouter initialEntries={["/papers/W123456"]}>
				<Routes>
					<Route path="/papers/:id" element={<PaperPage />} />
				</Routes>
			</MemoryRouter>
		);

        await user.click(await screen.findByRole("button", { name: "Saved" }));

        await user.click(screen.getByRole("button", { name: "Mock unsave" }));

        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();

        expect(toastSuccess).toHaveBeenCalledWith(
            "Removed from all collections",
            {
                duration: 2800
            }
        );
    });
});