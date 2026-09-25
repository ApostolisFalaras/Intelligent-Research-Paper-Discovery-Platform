import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PaperModal from "../../../src/components/papers/PaperModal.jsx";

const mockOnClose = vi.fn();
const mockOnSaved = vi.fn();

// Mock Folders
const folders = [
    {
        id: 1,
        name: "Machine Learning",
        paperCount: 4,
        color: "#123456"
    },
    {
        id: 2,
        name: "Databases",
        paperCount: 1,
        color: "#654321"
    }
];


describe("PaperModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();
	});


	// ---------- RENDERING TESTS ----------
	
	it("Loads all folders and existing paper memberships when opened", async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: [folders[0]]
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        expect(screen.getByText("Loading collections...")).toBeInTheDocument();
        expect(await screen.findByText("Machine Learning")).toBeInTheDocument();
        expect(screen.getByText("Databases")).toBeInTheDocument();

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/users/me/folders",
            {
                credentials: "include"
            }
        );

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/papers/W123/folders",
            {
                credentials: "include"
            }
        );

        expect(screen.getByText("1 selected")).toBeInTheDocument();
    });


    it("Displays singular and plural paper counts correctly", async () => {
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await screen.findByText("Machine Learning");

        expect(screen.getByText("4 papers")).toBeInTheDocument();
        expect(screen.getByText("1 paper")).toBeInTheDocument();
    });


    // ---------- USER INTERACTION TESTS ----------

    it("Allows a folder to be selected and deselected", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        const folder = await screen.findByText("Machine Learning");
        await user.click(folder);

        expect(screen.getByText("1 selected")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();

        await user.click(folder);

        expect(screen.queryByText("1 selected")).not.toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });


    // ---------- FOLDER-PAPER INTERACTION TESTS ----------

    it("Adds the paper to a newly selected folder", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await user.click(await screen.findByText("Machine Learning"));

        // Folder membership request
        globalThis.fetch.mockResolvedValueOnce({ ok: true });

        // Global save activity request
        globalThis.fetch.mockResolvedValueOnce({ ok: true });

        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/users/me/folders/1/papers/W123",
                {
                    method: "POST",
                    credentials: "include"
                }
            );
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/papers/42/save",
            {
                method: "POST",
                credentials: "include"
            }
        );

        expect(mockOnSaved).toHaveBeenCalledWith({ isSaved: true, folderIds: [1] });
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });


    it("Removes the paper from its final folder and records an unsave activity", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: [folders[0]]
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await user.click(await screen.findByText("Machine Learning"));

        globalThis.fetch.mockResolvedValueOnce({ ok: true });

        globalThis.fetch.mockResolvedValueOnce({ ok: true });

        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/users/me/folders/1/papers/W123",
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/papers/42/unsave",
            {
                method: "POST",
                credentials: "include"
            }
        );

        expect(mockOnSaved).toHaveBeenCalledWith({ isSaved: false, folderIds: [] });
    });


     it("Does not record global save or unsave activity when moving between saved folders", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: [folders[0]]
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await screen.findByText("Machine Learning");

        // Remove folder 1
        await user.click(screen.getByText("Machine Learning"));

        // Add folder 2
        await user.click(screen.getByText("Databases"));

        globalThis.fetch
            .mockResolvedValueOnce({ ok: true })
            .mockResolvedValueOnce({ ok: true });

        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/users/me/folders/1/papers/W123",
                expect.objectContaining({
                    method: "DELETE"
                })
            );
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/users/me/folders/2/papers/W123",
            expect.objectContaining({
                method: "POST"
            })
        );

        expect(globalThis.fetch).not.toHaveBeenCalledWith(
            "/api/papers/42/save",
            expect.anything()
        );

        expect(globalThis.fetch).not.toHaveBeenCalledWith(
            "/api/papers/42/unsave",
            expect.anything()
        );

        expect(mockOnSaved).toHaveBeenCalledWith({ isSaved: true, folderIds: [2] });
    });


    it("Does not close the modal when a folder update fails", async () => {
        const user = userEvent.setup();

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await user.click(await screen.findByText("Machine Learning"));

        globalThis.fetch.mockResolvedValueOnce({ ok: false, status: 500 });

        await user.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });

        expect(mockOnSaved).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
    });


    // ---------- FOLDER MUTATION TESTS ----------

    it("Creates a new collection", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await screen.findByText("Machine Learning");

        await user.click(screen.getByRole("button", { name: /New collection/i }));

        const input = screen.getByPlaceholderText("Collection name...");
        await user.type(input, "AI Papers");

        // Create request
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            json: vi.fn().mockResolvedValue({})
        });

        // loadFolders() runs again after creation
        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: [
                            ...folders,
                            {
                                id: 3,
                                name: "AI Papers",
                                paperCount: 0
                            }
                        ]
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/users/me/folders",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        name: "AI Papers"
                    })
                }
            );
        });

        expect(await screen.findByText("AI Papers")).toBeInTheDocument();
    });


    it("Deletes a collection after confirmation", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await screen.findByText("Machine Learning");

        const deleteButtons = screen.getAllByTitle("Delete collection");

        await user.click(deleteButtons[0]);

        expect(screen.getByText('Delete "Machine Learning"?')).toBeInTheDocument();

        globalThis.fetch.mockResolvedValueOnce({ ok: true });

        await user.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/users/me/folders/1",
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );
        });

        expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();
    });


    it("Closes when Cancel is clicked", async () => {
        const user = userEvent.setup();

        globalThis.fetch
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: folders
                    }
                })
            })
            .mockResolvedValueOnce({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    data: {
                        folders: []
                    }
                })
            });

        render(
            <PaperModal
                paperId="W123"
                paperInternalId={42}
                paperTitle="Research Paper"
                onClose={mockOnClose}
                onSaved={mockOnSaved}
            />
        );

        await user.click(screen.getByRole("button", { name: "Cancel" }));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});