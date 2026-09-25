import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SignupForm from "../../../src/components/auth/SignupForm.jsx";

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


describe("SignupForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		globalThis.fetch = vi.fn();

		mockRefreshUser.mockResolvedValue({
			id: 123,
			username: "johndoe"
		});
	});


    // ---------- HELPER THAT FILLS THE REGISTRATION FORM WITH DATA ----------

    async function fillForm(user, {
        firstName = "John",
        lastName = "Doe",
        username = "johndoe",
        email = "johndoe@example.com",
        password = "Password123!",
        confirmPassword = "Password123!"
    } = {}) {

        await user.type(screen.getByPlaceholderText("John"), firstName);
        await user.type(screen.getByPlaceholderText("Doe"), lastName);
        await user.type(screen.getByPlaceholderText("johndoe12345"), username);
        await user.type(screen.getByPlaceholderText("johndoe@email.com"), email);
        await user.type(screen.getByPlaceholderText("At least 8 characters"), password);
        await user.type(screen.getByPlaceholderText("Confirm your password"), confirmPassword);
    }


	// ---------- AUTHENTICATION TESTS ----------

    it("Validates required registration fields", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        await user.click(
            screen.getByRole("button", {
                name: "Create account"
            })
        );

        expect(screen.getByText("3–20 characters, letters, numbers, and underscores only."))
            .toBeInTheDocument();
        expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
        expect(screen.getByText("At least 8 characters required.")).toBeInTheDocument();

        expect(globalThis.fetch).not.toHaveBeenCalled();
    }); 


    it("Rejects an invalid username", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        await fillForm(user, { username: "a!" });

        await user.click(screen.getByRole("button", { name: "Create account" }));

        expect(screen.getByText("3–20 characters, letters, numbers, and underscores only."))
            .toBeInTheDocument();

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });


    it("Rejects an invalid email address", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        await fillForm(user, { email: "not-an-email" });

        await user.click(screen.getByRole("button", { name: "Create account" }));

        expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });


    it("Rejects passwords shorter than eight characters", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        await fillForm(user, {
            password: "Pass1!",
            confirmPassword: "Pass1!"
        });

        await user.click(screen.getByRole("button", { name: "Create account" }));

        expect(screen.getByText("At least 8 characters required.")).toBeInTheDocument();

        expect(globalThis.fetch).not.toHaveBeenCalled();
    });


    it("Shows when passwords do not match", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        await user.type(screen.getByPlaceholderText("At least 8 characters"), "Password123!");

        await user.type(screen.getByPlaceholderText("Confirm your password"), "Different123!");

        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });


    it("Shows when passwords match", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        await user.type(screen.getByPlaceholderText("At least 8 characters"), "Password123!");

        await user.type(screen.getByPlaceholderText("Confirm your password"), "Password123!");

        expect(screen.getByText("Passwords match")).toBeInTheDocument();
    });


    it("Displays password strength while entering a password", async () => {
        const user = userEvent.setup();

        render(<SignupForm />);

        expect(screen.queryByText(/Weak|Fair|Good|Strong|Very Strong/)).not.toBeInTheDocument();

        await user.type(screen.getByPlaceholderText("At least 8 characters"),"Password123!");

        expect(screen.getByText(/Weak|Fair|Good|Strong|Very Strong/)).toBeInTheDocument();
    });


    it("Submits registration data to the API", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            status: 201,
            json: vi.fn().mockResolvedValue({})
        });

        render(<SignupForm />);

        await fillForm(user);

        await user.type(screen.getByPlaceholderText("MIT, IBM Research, etc."), "MIT");

        await user.type(screen.getByPlaceholderText("Boston, Massachusetts"), "Boston");

        await user.selectOptions(screen.getByRole("combobox"), "Research Scientist");

        await user.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            "/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    username: "johndoe",
                    email: "johndoe@example.com",
                    password: "Password123!",
                    affiliation: "MIT",
                    location: "Boston",
                    role: "Research Scientist"
                })
            }
        );
    });


    it("Sends optional affiliation and role as null when omitted", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            status: 201,
            json: vi.fn().mockResolvedValue({})
        });

        render(<SignupForm />);

        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => {
            expect(globalThis.fetch).toHaveBeenCalled();
        });

        const [, options] = globalThis.fetch.mock.calls[0];

        expect(JSON.parse(options.body)).toMatchObject({
            affiliation: null,
            role: null
        });
    });


    it("Refreshes the user and navigates home after registration", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: true,
            status: 201,
            json: vi.fn().mockResolvedValue({})
        });

        render(<SignupForm />);

        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "Create account" }));

        await waitFor(() => {
            expect(mockRefreshUser).toHaveBeenCalledTimes(1);
        });

        expect(toastSuccess).toHaveBeenCalledWith("Your account was created successfully.");
        
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });


    it("Shows server registration errors", async () => {
        const user = userEvent.setup();

        globalThis.fetch.mockResolvedValue({
            ok: false,
            status: 409,
            json: vi.fn().mockResolvedValue({
                message: "Username already exists."
            })
        });

        render(<SignupForm />);

        await fillForm(user);

        await user.click(screen.getByRole("button", { name: "Create account" }));

        expect(await screen.findByText("Username already exists.")).toBeInTheDocument();

        expect(toastError).toHaveBeenCalledWith("Username already exists.");

        expect(mockRefreshUser).not.toHaveBeenCalled();

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});