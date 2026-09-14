import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import TopicSelect from "../../../src/components/search/TopicSelect.jsx";
import { useTopics } from "../../../src/hooks/useTopics.jsx";

vi.mock("../../../src/hooks/useTopics.jsx", () => ({
	useTopics: vi.fn()
}));


// Using a small representative set of topics
const topics = [
    {
        topicId: "T1",
        topicName: "Artificial Intelligence",
        fieldName: "Computer Science"
    },
    {
        topicId: "T2",
        topicName: "Machine Learning",
        fieldName: "Computer Science"
    },
    {
        topicId: "T3",
        topicName: "Cardiology",
        fieldName: "Medicine"
    }
];


describe("TopicSelect", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		useTopics.mockReturnValue({
			topics,
			loading: false,
			error: null,
			refresh: vi.fn()
		});
	});

	// ---------- RENDERING TESTS ----------

	it("Shows the default placeholder when no topic is selected", () => {
		render(
			<TopicSelect 
				value=""
				onChange={() => {}}
			/>
		);

		expect(screen.getByText("Select a topic...")).toBeInTheDocument();
	});


	it("Shows the loading state", () => {
		useTopics.mockReturnValue({ topics: [], loading: true });

		render(
			<TopicSelect 
				value=""
				onChange={() => {}}
			/>
		);

		expect(screen.getByText("Loading topics...")).toBeInTheDocument();
	});


	it("Does not open the dropdown while topic are loading", async () => {
		const user = userEvent.setup();
		useTopics.mockReturnValue({ topics: [], loading: true });

		render(
			<TopicSelect 
				value=""
				onChange={() => {}}
			/>
		);

		const button = screen.getByRole("button", { name: /loading topics/i });
		await user.click(button);

		expect(screen.queryByPlaceholderText("Search topics...")).not.toBeInTheDocument();
	});


	it("Opens the dropdown when the selector is clicked", async () => {
		const user = userEvent.setup();

		render(
			<TopicSelect 
				value=""
				onChange={() => {}}
			/>
		);

		const button = screen.getByRole("button", { name: /select a topic/i });
		await user.click(button);

		expect(screen.getByPlaceholderText("Search topics...")).toBeInTheDocument();
	});


	it("Renders the available topics when opened", async () => {
		const user = userEvent.setup();

		render(
			<TopicSelect 
				value=""
				onChange={() => {}}
			/>
		);

		const button = screen.getByRole("button", { name: /select a topic/i });
		await user.click(button);

	 	expect(screen.getByText("Artificial Intelligence")).toBeInTheDocument();
        expect(screen.getByText("Machine Learning")).toBeInTheDocument();
        expect(screen.getByText("Cardiology")).toBeInTheDocument();
	});


	it("Groups topics by their field", async () => {
		const user = userEvent.setup();

		render(
			<TopicSelect 
				value=""
				onChange={() => {}}
			/>
		);
		
		const button = screen.getByRole("button", { name: /select a topic/i });
		await user.click(button);

		expect(screen.getByText("Computer Science")).toBeInTheDocument();
        expect(screen.getByText("Medicine")).toBeInTheDocument();
	});


	it("Displays the selected topic names", () => {
		render(
            <TopicSelect
                value="T2"
                onChange={() => {}}
            />
        );

        expect(screen.getByText("Machine Learning")).toBeInTheDocument();
	});


	// ---------- USER TOPIC SELECTION ACTIVITY TESTS ----------

	it("Calls onChange with the selected topic id", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        render(
            <TopicSelect
                value=""
                onChange={onChange}
            />
        );

		const selectButton = screen.getByRole("button", { name: /select a topic/i });
        await user.click(selectButton);

		const topicButton = screen.getByRole("button", { name: /machine learning/i });
        await user.click(topicButton);

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith("T2");
    });


	it("Closes the dropdown after selecting a topic", async () => {
        const user = userEvent.setup();

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

        const selectButton = screen.getByRole("button", { name: /select a topic/i });
        await user.click(selectButton);

		const topicButton = screen.getByRole("button", { name: /machine learning/i });
        await user.click(topicButton);

        expect(screen.queryByPlaceholderText("Search topics...")).not.toBeInTheDocument();
    });


	it("Filters topics by topic name", async () => {
        const user = userEvent.setup();

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

		const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

        const searchInput = screen.getByPlaceholderText("Search topics...");
        await user.type(searchInput, "machine");

        expect(screen.getByText("Machine Learning")).toBeInTheDocument();
        expect(screen.queryByText("Artificial Intelligence")).not.toBeInTheDocument();
        expect(screen.queryByText("Cardiology")).not.toBeInTheDocument();
    });


	 it("Filters topics by field name", async () => {
        const user = userEvent.setup();

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

		const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

		const searchInput = screen.getByPlaceholderText("Search topics...");
        await user.type(searchInput, "medicine");

        expect(screen.getByText("Cardiology")).toBeInTheDocument();
        expect(screen.queryByText("Machine Learning")).not.toBeInTheDocument();
    });


	it("Shows a no-match message when no topics match the search", async () => {
        const user = userEvent.setup();

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

		const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

		const searchInput = screen.getByPlaceholderText("Search topics...");
        await user.type(searchInput, "quantum bananas");

        expect(screen.getByText('No topics match "quantum bananas"')).toBeInTheDocument();
    });


	it("Clears the topic search query", async () => {
        const user = userEvent.setup();

        const { container } = render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

        const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

        const searchInput = screen.getByPlaceholderText("Search topics...");
        await user.type(searchInput, "machine");

        await user.click(container.querySelector("#clear-dropdown-search-btn"));

        expect(searchInput).toHaveValue("");

        expect(screen.getByText("Artificial Intelligence")).toBeInTheDocument();
        expect(screen.getByText("Cardiology")).toBeInTheDocument();
    });


	 it("Clears the selected topic", async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();

        const { container } = render(
            <TopicSelect
                value="T2"
                onChange={onChange}
            />
        );

        await user.click(container.querySelector("#topic-clear-selected"));

        expect(onChange).toHaveBeenCalledWith("");
    });


	it("Does not open the dropdown when clearing the selected topic", async () => {
        const user = userEvent.setup();

        const { container } = render(
            <TopicSelect
                value="T2"
                onChange={() => {}}
            />
        );

        await user.click(container.querySelector("#topic-clear-selected"));

        expect(screen.queryByPlaceholderText("Search topics...")).not.toBeInTheDocument();
    });


    it("Closes the dropdown when clicking outside", async () => {
        const user = userEvent.setup();

        render(
            <div>
                <TopicSelect
                    value=""
                    onChange={() => {}}
                />

                <button>Outside</button>
            </div>
        );

		const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

        expect(screen.getByPlaceholderText("Search topics...")).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }));

        expect(screen.queryByPlaceholderText("Search topics...")).not.toBeInTheDocument();
    });


    it("Shows the hook error when loading topics fails", async () => {
        const user = userEvent.setup();

        useTopics.mockReturnValue({
            topics: [],
            error: new Error("Failed to fetch topics")
        });

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

		const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

        expect(screen.getByText("Failed to fetch topics")).toBeInTheDocument();
    });


    it("Shows the fallback error message when the error has no message", async () => {
        const user = userEvent.setup();

        useTopics.mockReturnValue({ topics: [], error: {} });

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

		const button = screen.getByRole("button", { name: /select a topic/i });
        await user.click(button);

        expect(screen.getByText("Unable to load topics")).toBeInTheDocument();
    });


    it("Calls refresh when Try again is clicked", async () => {
        const user = userEvent.setup();
        const refresh = vi.fn();

        useTopics.mockReturnValue({
            topics: [],
            error: new Error("Request failed"),
            refresh
        });

        render(
            <TopicSelect
                value=""
                onChange={() => {}}
            />
        );

		const selectButton = screen.getByRole("button", { name: /select a topic/i });
        await user.click(selectButton);

		const tryAgainButton = screen.getByRole("button", { name: /try again/i });
        await user.click(tryAgainButton);

        expect(refresh).toHaveBeenCalledTimes(1);
    });
});