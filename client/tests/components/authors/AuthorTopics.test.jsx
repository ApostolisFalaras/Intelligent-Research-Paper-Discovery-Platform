import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthorTopics from "../../../src/components/authors/AuthorTopics.jsx";


const mockTopics = [
	{
		id: "T1",
		displayName: "Machine Learning",
		field: "Computer Science",
		subfield: "Artificial Intelligence",
		worksCount: 24
	},
	{
		id: "T2",
		displayName: "Natural Language Processing",
		field: "Computer Science",
		subfield: "Artificial Intelligence",
		worksCount: 15
	},
	{
		id: "T3",
		displayName: "Database Systems",
		field: "Computer Science",
		subfield: "Information Systems",
		worksCount: 12
	},
	{
		id: "T4",
		displayName: "Computer Networks",
		field: "Computer Science",
		subfield: "Computer Networks",
		worksCount: 8
	}
];


describe("AuthorTopics", () => {

	// ---------- RENDERING TESTS ----------
	
	it("Displays the Research Areas heading", () => {
		render(<AuthorTopics topics={mockTopics} />);

		expect(screen.getByText("Research Areas")).toBeInTheDocument();
	});


	it("Groups topics by their subfield", () => {
		render(<AuthorTopics topics={mockTopics} />);

		expect(screen.getByText("Computer Science • Artificial Intelligence")).toBeInTheDocument();
		expect(screen.getByText("Computer Science • Information Systems")).toBeInTheDocument();
	});


	it("Displays all topics belonging to the visible subfields", () => {
		render(<AuthorTopics topics={mockTopics} />);

		expect(screen.getByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Natural Language Processing")).toBeInTheDocument();
		expect(screen.getByText("Database Systems")).toBeInTheDocument();
	});


	it("Displays the works count for each visible topic", () => {
		render(<AuthorTopics topics={mockTopics} />);

		expect(screen.getByText("24")).toBeInTheDocument();
		expect(screen.getByText("15")).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();
	});


	it("Initially displays only the first two subfields", () => {
		render(<AuthorTopics topics={mockTopics} />);

		expect(screen.getByText("Machine Learning")).toBeInTheDocument();
		expect(screen.getByText("Database Systems")).toBeInTheDocument();
		expect(screen.queryByText("Computer Networks")).not.toBeInTheDocument();
	});


	it("Displays all subfields when Show more is clicked", async () => {
		const user = userEvent.setup();

		render(<AuthorTopics topics={mockTopics} />);

		await user.click(screen.getByRole("button", { name: /Show more/i }));

		expect(screen.getByText("Computer Networks")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Show less/i })).toBeInTheDocument();
	});


	it("Collapses the topics when Show less is clicked", async () => {
		const user = userEvent.setup();

		render(<AuthorTopics topics={mockTopics} />);

		await user.click(screen.getByRole("button", { name: /Show more/i }));

		expect(screen.getByText("Computer Networks")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Show less/i }));

		expect(screen.queryByText("Computer Networks")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Show more/i })).toBeInTheDocument();
	});


	it("Does not display the expand button when there are two or fewer subfields", () => {
		const topics = mockTopics.slice(0, 3);

		render(<AuthorTopics topics={topics} />);

		expect(screen.queryByRole("button", { name: /Show more/i })).not.toBeInTheDocument();

		expect(screen.queryByRole("button", { name: /Show less/i })).not.toBeInTheDocument();
	});


	it("Handles an empty topics array", () => {
		render(<AuthorTopics topics={[]} />);

		expect(screen.getByText("Research Areas")).toBeInTheDocument();
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});