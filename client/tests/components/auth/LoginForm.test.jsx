import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoginForm from "../../../src/components/auth/LoginForm.jsx";

const mockRefreshUser = vi.fn();
const mockNavigate = vi.fn();

const toastSuccess = vi.fn();
const toastError = vi.fn();


// Mocking hooks and library functions used by the form
vi.mock("../../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => ({
		refreshUser: mockRefreshUser
	})
}));

vi.mock("react-router-dom", () => ({
	useNavigate: () => mockNavigate
}));

vi.mock("sonner", () => ({
	toast: {
		success: (...args) => toastSuccess(...args),
		error: (...args) => toastError(...args)
	}
}));


describe("LoginForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();

		mockRefreshUser.mockResolvedValue({
			id: 123,
			username: "johndoe"
		});
	});


	// ---------- AUTHENTICATION TESTS ----------

	it("Validates required username and password fields", async () => {
		const user = userEvent.setup();

		render(<LoginForm />);

		const signinButton = screen.getByRole("button", { name: "Sign in" });
		await user.click(signinButton);

		expect(screen.getByText("Username is required.")).toBeInTheDocument();
		expect(screen.getByText("Password is required.")).toBeInTheDocument();
	});


	 it("Submits the login credentials to the API", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                message: "Logged in"
            })
        });

        render(<LoginForm />);


        await user.type(screen.getByPlaceholderText("johndoe12345"), "john");

        await user.type(screen.getByPlaceholderText("Your password"), "password123");

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    username: "john",
                    password: "password123"
                })
            }
        );
    });


	it("Refreshes the authenticated user after successful login", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                message: "Logged in"
            })
        });

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("johndoe12345"), "john");

        await user.type(screen.getByPlaceholderText("Your password"), "password123");

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        await waitFor(() => {
            expect(mockRefreshUser).toHaveBeenCalledTimes(1);
        });
    });


	it("Shows success feedback and navigates home after login", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({})
        });

		mockRefreshUser.mockResolvedValue({
			id: 123,
			username: "john"
		});

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("johndoe12345"), "john");

        await user.type(screen.getByPlaceholderText("Your password"), "password123");

        await user.click(screen.getByRole("button", { name: "Sign in" }));

		await waitFor(() => {
            expect(toastSuccess).toHaveBeenCalledWith("You have successfully signed in.");
        });

        expect(mockNavigate).toHaveBeenCalledWith("/");
    });


	it("Shows the server error when login is rejected", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: false,
            status: 401,
            json: vi.fn().mockResolvedValue({
                message: "Invalid username or password."
            })
        });

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("johndoe12345"), "john");

        await user.type(screen.getByPlaceholderText("Your password"), "wrong-password");

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByText("Invalid username or password.")).toBeInTheDocument();

        expect(toastError).toHaveBeenCalledWith("Invalid username or password.");

        expect(mockRefreshUser).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });


	 it("Handles network errors", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockRejectedValue(new Error("Network failure"));

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("johndoe12345"), "john");

        await user.type(screen.getByPlaceholderText("Your password"), "password123");

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByText("Network failure")).toBeInTheDocument();

        expect(toastError).toHaveBeenCalledWith("Network failure");
        expect(mockNavigate).not.toHaveBeenCalled();
    });


	it("Treats failure to refresh the user as a login failure", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({})
        });

        mockRefreshUser.mockResolvedValue(null);

        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("johndoe12345"), "john");

        await user.type(screen.getByPlaceholderText("Your password"), "password123");

        await user.click(screen.getByRole("button", { name: "Sign in" }));

        expect(await screen.findByText("Login succeeded, but the authenticated user could not be loaded."))
			.toBeInTheDocument();

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});