import { describe, it, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NewFolderModal from "../../../src/components/library/NewFolderModal.jsx";


describe("NewFolderModal", () => {

	// ---------- RENDERING TESTS ----------

	it("Displays the new collection form", () => {
		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		expect(screen.getByRole("heading", { name: "New Collection" })).toBeInTheDocument();
		expect(screen.getByPlaceholderText("e.g., Computer Science")).toBeInTheDocument();
		expect(screen.getByPlaceholderText("What papers will you collect here?")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Create folder" })).toBeInTheDocument();
	});


	it("Disables the create button when the folder name is empty", () => {
		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		expect(screen.getByRole("button", { name: "Create folder" })).toBeDisabled();
	});


	it("Keeps the create button disabled when the name contains only whitespace", async () => {
		const user = userEvent.setup();

		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		await user.type(screen.getByPlaceholderText("e.g., Computer Science"), "   ");

		expect(screen.getByRole("button", { name: "Create folder" })).toBeDisabled();
	});


	it("Enables the create button when a valid name is entered", async () => {
		const user = userEvent.setup();

		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		await user.type(screen.getByPlaceholderText("e.g., Computer Science"), "Machine Learning");

		expect(screen.getByRole("button", { name: "Create folder" })).toBeEnabled();
	});


	it("Updates the name and description fields", async () => {
		const user = userEvent.setup();

		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		const nameInput = screen.getByPlaceholderText("e.g., Computer Science");
		const descriptionInput = screen.getByPlaceholderText("What papers will you collect here?");

		await user.type(nameInput, "Machine Learning");

		await user.type(descriptionInput, "My machine learning papers");

		expect(nameInput).toHaveValue("Machine Learning");

		expect(descriptionInput).toHaveValue("My machine learning papers");
	});


	it("Applies the focus class to the name input while focused", async () => {
		const user = userEvent.setup();

		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		const input = screen.getByPlaceholderText("e.g., Computer Science");

		await user.click(input);
		expect(input).toHaveClass("name-focused");

		await user.tab();
		expect(input).not.toHaveClass("name-focused");
	});


	it("Applies the focus class to the description while focused", async () => {
		const user = userEvent.setup();

		render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={vi.fn()}
			/>
		);

		const textarea = screen.getByPlaceholderText("What papers will you collect here?");

		await user.click(textarea);
		expect(textarea).toHaveClass("desc-focused");

		await user.tab();
		expect(textarea).not.toHaveClass("desc-focused");
	});


	// ---------- CREATE FOLDER TESTS ----------

	it("Creates a folder using the default color", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const onCreate = vi.fn();

		render(
			<NewFolderModal 
				onClose={onClose}
				onCreate={onCreate}
			/>
		);

		await user.type(screen.getByPlaceholderText("e.g., Computer Science"),"Machine Learning");

		await user.type(screen.getByPlaceholderText("What papers will you collect here?"),
			"ML research papers"
		);

		await user.click(screen.getByRole("button", { name: "Create folder" }));

		expect(onCreate).toHaveBeenCalledWith("Machine Learning", "ML research papers", "#2D6A4F");

		expect(onClose).toHaveBeenCalledTimes(1);
	});


	it("Creates a folder using the selected color", async () => {
		const user = userEvent.setup();
		const onCreate = vi.fn();

		const { container } = render(
			<NewFolderModal 
				onClose={vi.fn()}
				onCreate={onCreate}
			/>
		);

		await user.type(screen.getByPlaceholderText("e.g., Computer Science"), "Databases");

		const colorButtons = container.querySelectorAll(".folder-color-option");

		await user.click(colorButtons[1]);

		await user.click(screen.getByRole("button", { name: "Create folder" }));

		expect(onCreate).toHaveBeenCalledWith("Databases", "", "#3B5B92");
	});


	// ---------- CLOSING MODAL BEHAVIOR TESTS ----------

	it("Calls onClose when Cancel is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const onCreate = vi.fn();

		render(
			<NewFolderModal 
				onClose={onClose}
				onCreate={onCreate}
			/>
		);

		await user.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onCreate).not.toHaveBeenCalled();
	});


	it("Calls onClose when the modal backdrop is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();

		const { container } = render(
			<NewFolderModal 
				onClose={onClose}
				onCreate={vi.fn()}
			/>
		);

		await user.click(container.querySelector("#new-folder-modal"));

		expect(onClose).toHaveBeenCalledTimes(1);
	});


	it("Does not close when the modal content is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();

		const { container } = render(
			<NewFolderModal 
				onClose={onClose}
				onCreate={vi.fn()}
			/>
		);

		const modal = container.querySelector("#new-folder-modal");

		await user.click(modal.firstElementChild);

		expect(onClose).not.toHaveBeenCalled();
	});


	it("Calls onClose when the header close button is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();

		const { container } = render(
			<NewFolderModal 
				onClose={onClose}
				onCreate={vi.fn()}
			/>
		);

		const closeButton = container.querySelector("#modal-header button");

		await user.click(closeButton);

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});