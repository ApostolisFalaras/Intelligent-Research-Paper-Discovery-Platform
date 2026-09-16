import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import InitialsAvatar from "../../../src/components/common/InitialsAvatar.jsx";


const mockLogout = vi.fn();
const mockNavigate = vi.fn();

const toastSuccess = vi.fn();
const toastError = vi.fn();


// Mocking authentication state
vi.mock("../../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => ({
		logout: mockLogout
	})
}));

// Mocking imported React modules
vi.mock("sonner", () => ({
	toast: {
		success: (...args) => toastSuccess(...args),
		error: (...args) => toastError(...args)
	}
}));

vi.mock("react-router-dom", async () => {
	const actual = await vi.importActual("react-router-dom");

	return {
		...actual,
		useNavigate: () => mockNavigate
	};
});


describe("InitialsAvatar", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockLogout.mockResolvedValue();
	});


	// ---------- RENDERING TESTS ----------

	it("Shows initials when the user has no avatar image", () => {
        render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL={null}
					variant="dark"
				/>
			</MemoryRouter>
		);

        expect(screen.getByText("JD")).toBeInTheDocument();

        expect(screen.queryByRole("img", { name: "Profile" })).not.toBeInTheDocument();
    });


	it("Shows the profile image when an avatar URL exists", () => {
		render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL="/avatars/user.jpg"
					variant="dark"
				/>
			</MemoryRouter>
		);

        const image = screen.getByRole("img", { name: "Profile" });
        expect(image).toHaveAttribute("src", "/avatars/user.jpg");

        expect(screen.queryByText("JD")).not.toBeInTheDocument();
    });


	it("Opens and closes the profile dropdown", async () => {
        const user = userEvent.setup();

        render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL={null}
					variant="dark"
				/>
			</MemoryRouter>
		);

        const button = screen.getByRole("button");
        
		expect(screen.queryByText("Account settings")).not.toBeInTheDocument();

        await user.click(button);

        expect(screen.getByText("Account settings")).toBeInTheDocument();
        expect(screen.getByText("Log out")).toBeInTheDocument();

        await user.click(button);

        expect(screen.queryByText("Account settings")).not.toBeInTheDocument();
    });


	it("Closes the dropdown when clicking outside", async () => {
        const user = userEvent.setup();

        render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL={null}
					variant="dark"
				/>
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button"));

        expect(screen.getByText("Account settings")).toBeInTheDocument();

        fireEvent.mouseDown(document.body);

        expect(screen.queryByText("Account settings")).not.toBeInTheDocument();
    });


	it("Navigates to account settings", async () => {
        const user = userEvent.setup();

        render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL={null}
					variant="dark"
				/>
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button"));

        await user.click(screen.getByRole("link", { name: "Account settings" }));

        expect(mockNavigate).toHaveBeenCalledWith("/account-settings");
    });


	it("Logs the user out successfully", async () => {
        const user = userEvent.setup();

        render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL={null}
					variant="dark"
				/>
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button"));

        await user.click(screen.getByRole("link", { name: "Log out" }));

        expect(mockLogout).toHaveBeenCalledTimes(1);

        expect(toastSuccess).toHaveBeenCalledWith("You have successfully logged out.");

        expect(mockNavigate).toHaveBeenCalledWith("/");
    });


	 it("Shows an error when logout fails", async () => {
        const user = userEvent.setup();

        mockLogout.mockRejectedValue(new Error("Logout failed"));

        render(
			<MemoryRouter>
				<InitialsAvatar 
					initials="JD"
					avatarURL={null}
					variant="dark"
				/>
			</MemoryRouter>
		);

        await user.click(screen.getByRole("button"));

        await user.click(screen.getByRole("link", { name: "Log out" }));

        expect(mockLogout).toHaveBeenCalledTimes(1);

        expect(toastError).toHaveBeenCalledWith("Failed to log out.");

        expect(toastSuccess).not.toHaveBeenCalled();

        expect(mockNavigate).not.toHaveBeenCalledWith("/");
    });
});