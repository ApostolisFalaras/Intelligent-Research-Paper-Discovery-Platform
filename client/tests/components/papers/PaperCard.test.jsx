import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PaperCard from "../../../src/components/papers/PaperCard.jsx";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate
}));

// Mock data -- NOT ACTUAL PAPER IN THE DATABASE
const mockPaper = {
    id: "W123456",
    internalId: 42,
    title: "Deep Learning for Scientific Discovery",
    primaryTopic: "Machine Learning",
    publicationYear: 2025,
    primarySource: "Nature",
    isOpenAccess: true,
    authorCount: 3,
    authorsPreview: [
        { name: "John Smith" },
        { name: "Jane Doe" }
    ],
    abstract: "This paper investigates deep learning methods.",
    citedByCount: 125
};

describe("PaperCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        globalThis.fetch = vi.fn();
    });

	// ---------- RENDERING TESTS ----------

    it("Displays the paper's main information", () => {
        render(
            <PaperCard
                paper={mockPaper}
                variant="search"
            />
        );

        expect(screen.getByText("Deep Learning for Scientific Discovery")).toBeInTheDocument();
        expect(screen.getByText("Machine Learning")).toBeInTheDocument();
        expect(screen.getByText("2025")).toBeInTheDocument();
        expect(screen.getByText("Nature")).toBeInTheDocument();
        expect(screen.getByText("125 citations")).toBeInTheDocument();
    });


    it("Displays 'Open Access' for open papers", () => {
        render(
            <PaperCard
                paper={mockPaper}
                variant="search"
            />
        );

        expect(screen.getByText("Open Access")).toBeInTheDocument();
    });


    it("Displays 'Not Open Access' for closed papers", () => {
        render(
            <PaperCard
                paper={{
                    ...mockPaper,
                    isOpenAccess: false
                }}
                variant="search"
            />
        );

        expect(screen.getByText("Not Open Access")).toBeInTheDocument();
    });


    it("Displays two authors followed by et al. for multiple authors", () => {
        render(
            <PaperCard
                paper={mockPaper}
                variant="search"
            />
        );

        expect(screen.getByText(/John Smith, Jane Doe/)).toBeInTheDocument();
        expect(screen.getByText("et al.")).toBeInTheDocument();
    });


    it("Displays only the author for a single-author paper", () => {
        render(
            <PaperCard
                paper={{
                    ...mockPaper,
                    authorCount: 1,
                    authorsPreview: [
                        { name: "John Smith" }
                    ]
                }}
                variant="search"
            />
        );

        expect(screen.getByText("John Smith")).toBeInTheDocument();
        expect(screen.queryByText("et al.")).not.toBeInTheDocument();
    });


    it("Displays the abstract only for search cards", () => {
        const { rerender } = render(
            <PaperCard
                paper={mockPaper}
                variant="search"
            />
        );

        expect(screen.getByText(mockPaper.abstract)).toBeInTheDocument();

        rerender(
            <PaperCard
                paper={mockPaper}
                variant="recommendation"
            />
        );

        expect(screen.queryByText(mockPaper.abstract)).not.toBeInTheDocument();
    });


	// ---------- USER INTERACTION TESTS ----------

    it("Expands and collapses the abstract without navigating", async () => {
        const user = userEvent.setup();

        render(
            <PaperCard
                paper={mockPaper}
                variant="search"
            />
        );

        const abstract = screen.getByText(mockPaper.abstract);
        expect(abstract).not.toHaveClass("expanded");

        await user.click(screen.getByRole("button", { name: "Read abstract" }));
        expect(abstract).toHaveClass("expanded");


        expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();

        expect(mockNavigate).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Show less" }));

        expect(abstract).not.toHaveClass("expanded");
    });


    it("Navigates directly to the paper from a search card", async () => {
        const user = userEvent.setup();

        render(
            <PaperCard
                paper={mockPaper}
                variant="search"
            />
        );

        await user.click(screen.getByText(mockPaper.title));

        expect(mockNavigate).toHaveBeenCalledWith("/papers/W123456");

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });


	// ---------- USER RECOMMENDATION ACTIVITY TESTS ----------

    it("Records a recommendation click before navigating from a recommendation card", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            status: 200
        });

        render(
            <PaperCard
                paper={mockPaper}
                variant="recommendation"
            />
        );

        await user.click(screen.getByText(mockPaper.title));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledWith(
                "/api/papers/42/recommendation-click",
                {
                    method: "POST",
                    credentials: "include"
                }
            );
        });

        expect(mockNavigate).toHaveBeenCalledWith("/papers/W123456");
    });


    it("Still navigates if recording the recommendation click fails", async () => {
        const user = userEvent.setup();

        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        globalThis.fetch.mockRejectedValue(new Error("Network error"));

        render(
            <PaperCard
                paper={mockPaper}
                variant="recommendation"
            />
        );

        await user.click(screen.getByText(mockPaper.title));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/papers/W123456");
        });

        consoleSpy.mockRestore();
    });
});