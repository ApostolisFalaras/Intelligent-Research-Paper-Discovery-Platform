import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FolderCard from "../../../src/components/library/FolderCard.jsx";


// Mock folder data 
const mockFolder = {
	id: 1,
	name: "Machine Learning",
	summary: "Papers about machine learning research.",
	color: "#2D6A4F",
	paperCount: 4,
	updatedAt: "2 days ago",

	papersPreview: [
		{
			id: "W1",
			title: "Deep Learning Paper",
			primaryTopic: "Machine Learning"
		},
		{
			id: "W2",
			title: "Neural Networks Paper",
			primaryTopic: "Artificial Intelligence"
		},
		{
			id: "W3",
			title: "Transformers Paper",
			primaryTopic: "Deep Learning"
		}
	]
};


describe("FolderCard", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the folder information", () => {
		render(
			<FolderCard
				folder={mockFolder}
				onClick={vi.fn()}
			/>
		);

		expect(screen.getByRole("heading", { name: "Machine Learning" })).toBeInTheDocument();
		expect(screen.getByText("Papers about machine learning research.")).toBeInTheDocument();
		expect(screen.getByText("4")).toBeInTheDocument();
		expect(screen.getByText("2 days ago")).toBeInTheDocument();
	});


	it("Displays the preview papers", () => {
		render(
			<FolderCard
				folder={mockFolder}
				onClick={vi.fn()}
			/>
		);

		expect(screen.getByText("Deep Learning Paper")).toBeInTheDocument();
		expect(screen.getByText("Neural Networks Paper")).toBeInTheDocument();
		expect(screen.getByText("Transformers Paper")).toBeInTheDocument();
		expect(screen.getByText("Machine Learning", { selector: ".paper-preview-topic" }))
			.toBeInTheDocument();
		expect(screen.getByText("Artificial Intelligence")).toBeInTheDocument();
	});


	it("Displays the number of remaining papers when more than two previews exist", () => {
		render(
			<FolderCard
				folder={mockFolder}
				onClick={vi.fn()}
			/>
		);

		expect(screen.getByText("+2 more")).toBeInTheDocument();
	});


	it("Displays the empty state when the folder contains no preview papers", () => {
		render(
			<FolderCard
				folder={{
					...mockFolder,
					paperCount: 0,
					papersPreview: []
				}}
				onClick={vi.fn()}
			/>
		);

		expect(screen.getByText("No papers yet")).toBeInTheDocument();
		expect(screen.queryByText("Deep Learning Paper")).not.toBeInTheDocument();
	});


	it("Displays fallback values when folder information is missing", () => {
		const { container } = render(
			<FolderCard
				folder={{}}
				onClick={vi.fn()}
			/>
		);

		expect(screen.getAllByText("-")).toHaveLength(3);

		expect(screen.getByText("0")).toBeInTheDocument();

		expect(container.querySelector(".color-band")).toHaveStyle({ backgroundColor: "#1B4332" });
	});


	it("Calls onClick when the folder card is clicked", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		const { container } = render(
			<FolderCard
				folder={mockFolder}
				onClick={onClick}
			/>
		);

		await user.click(container.querySelector(".folder-card"));

		expect(onClick).toHaveBeenCalledTimes(1);
	});


	it("Does not trigger the folder click when the more button is clicked", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();

		const { container } = render(
			<FolderCard
				folder={mockFolder}
				onClick={onClick}
			/>
		);

		await user.click(container.querySelector(".folder-card-more"));

		expect(onClick).not.toHaveBeenCalled();
	});
});