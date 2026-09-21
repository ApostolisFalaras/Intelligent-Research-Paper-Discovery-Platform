import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import TopicRow from "../../../src/components/explore/TopicRow.jsx";


// Mocking inner element
vi.mock("../../../src/components/papers/PaperCard.jsx", () => ({
	default: ({ paper }) => (
		<div data-testid={`paper-card-${paper.id}`}>
			{paper.title}
		</div>
	)
}));

// Mock data
const mockTopicPreview = {
	topic: {
		id: "T100",
		displayName: "Machine Learning",
		fieldDisplayName: "Computer Science"
	},
	papers: [
		{ id: "W1", title: "Deep Learning Research" },
		{ id: "W2", title: "Neural Network Systems" },
		{ id: "W3", title: "Machine Learning Applications" }
	]
};


describe("TopicRow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});


	// ---------- RENDERING TESTS ----------

	it("Displays the topic name and field", () => {
		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		expect(screen.getByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Computer Science")).toBeInTheDocument();
	});


	it("Displays the topic's preview papers", () => {
		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		expect(screen.getByTestId("paper-card-W1")).toBeInTheDocument();
		expect(screen.getByTestId("paper-card-W2")).toBeInTheDocument();
		expect(screen.getByTestId("paper-card-W3")).toBeInTheDocument();

		expect(screen.getAllByTestId(/^paper-card-/)).toHaveLength(3);
	});


	it("Passes the papers to PaperCard", () => {
		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		expect(screen.getByText("Deep Learning Research")).toBeInTheDocument();
		expect(screen.getByText("Neural Network Systems")).toBeInTheDocument();
		expect(screen.getByText("Machine Learning Applications")).toBeInTheDocument();
	});


	it("Renders no paper cards when the topic contains no preview papers", () => {
		render(
			<MemoryRouter>
				<TopicRow topicPreview={[]} />
			</MemoryRouter>
		);

		expect(screen.queryAllByTestId(/^paper-card-/)).toHaveLength(0);
	});


	// ---------- NAVIGATION LINKS TESTS ----------

	it("Links the header See all action to the topic explore page", () => {
		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		const seeAllLinks = screen.getAllByRole("link", { name: /See all/i });

		expect(seeAllLinks[0]).toHaveAttribute("href", "/explore/topic/T100");
	});


	it("Links the final See all entry to the topic explore page", () => {
		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		const seeAllLinks = screen.getAllByRole("link", { name: /See all/i });

		expect(seeAllLinks[1]).toHaveAttribute("href", "/explore/topic/T100");
	});


	// ---------- SCROLLING TESTS ----------

	it("Scrolls the paper row to the left", async () => {
		const user = userEvent.setup();

		const scrollBy = vi.fn();

		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		const scrollContainer = document.querySelector(".scroll-container");
		scrollContainer.scrollBy = scrollBy;

		const leftButton = await user.click(screen.getByRole("button", { name: "Scroll left" }));
		await user.click(leftButton);

		expect(scrollBy).toHaveBeenCalledWith({ left: -500, behavior: "smooth" });
	});


	it("Scrolls the paper row to the right", async () => {
		const user = userEvent.setup();
		const scrollBy = vi.fn();

		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		const scrollContainer = document.querySelector(".scroll-container");
		scrollContainer.scrollBy = scrollBy;

		const rightButton = await user.click(screen.getByRole("button", { name: "Scroll right" }));
		await user.click(rightButton);

		expect(scrollBy).toHaveBeenCalledWith({ left: 500, behavior: "smooth" });
	});


	// ---------- SEE-ALL HOVER TESTS ----------

	it("Changes the final See all entry background on hover", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter>
				<TopicRow topicPreview={mockTopicPreview} />
			</MemoryRouter>
		);

		const seeAllLinks = screen.getAllByRole("link", { name: /See all/i });

		const finalSeeAll = seeAllLinks[1];

		const initialBackground = finalSeeAll.style.background;

		await user.hover(finalSeeAll);
		expect(finalSeeAll.style.background).not.toBe(initialBackground);

		await user.unhover(finalSeeAll);
		expect(finalSeeAll.style.background).toBe(initialBackground);
	});
});