import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AuthPage from "../../src/AuthPage.jsx";


// Mocking all inner elements
vi.mock("../../src/components/auth/LoginForm.jsx", () => ({
	default: () => (
		<div data-testid="login-form">
			Login Form
		</div>
	)
}));

vi.mock("../../src/components/auth/SignupForm.jsx", () => ({
	default: () => (
		<div data-testid="signup-form">
			Signup Form
		</div>
	)
}));


describe("AuthPage", () => {
	
	// ---------- INITIAL RENDERING TESTS ----------

	it("Shows the sign-in form by default", () => {
		render(<AuthPage />);

		// We use queryByTestId for the hidden form 
		// as it won't throw an error if it can't find the element
		expect(screen.getByTestId("login-form")).toBeInTheDocument();
		expect(screen.queryByTestId("signup-form")).not.toBeInTheDocument();

		expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();

		expect(screen.getByText("Sign in to access your personalized research feed.")).toBeInTheDocument();
	});


	// ---------- TAB SWITCHING TESTS ----------

	it("Switches to the create-account form", async () => {
		const user = userEvent.setup();

		render(<AuthPage />);

		const button = screen.getByRole("button", { name: "Create account" });
		await user.click(button);

		expect(screen.getByTestId("signup-form")).toBeInTheDocument();
		expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();

		expect(screen.getByRole("heading", { name: "Join Scholaris" })).toBeInTheDocument();
        expect(screen.getByText("Create a free account to save papers and get recommendations"))
			.toBeInTheDocument();
	});


	 it("Switches back to the sign-in form", async () => {
        const user = userEvent.setup();

        render(<AuthPage />);

		const registerButton = screen.getByRole("button", { name: "Create account" });
        await user.click(registerButton);

        expect(screen.getByTestId("signup-form")).toBeInTheDocument();

		// There are two Sign in buttons:
        //  1. The Sign in tab
        //  2. The bottom Sign in button
        // Select the top one specifically.
		const signinButton = screen.getAllByRole("button", { name: "Sign in" });
        await user.click(signinButton[0]);

        expect(screen.getByTestId("login-form")).toBeInTheDocument();

        expect(screen.queryByTestId("signup-form")).not.toBeInTheDocument();

        expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    });


	// ---------- BOTTOM-OF-THE-FORM ACTIONS TESTS ----------

	it("Switches to create account using the bottom Create One button", async () => {
        const user = userEvent.setup();

        render(<AuthPage />);

        expect(screen.getByText(/Don't have an account\?/)).toBeInTheDocument();

		const createButton = screen.getByRole("button", { name: "Create One" });
        await user.click(createButton);

        expect(screen.getByTestId("signup-form")).toBeInTheDocument();

        expect(screen.getByText(/Already have an account\?/)).toBeInTheDocument();
    });


	it("Switches to sign in using the bottom Sign in button", async () => {
        const user = userEvent.setup();

        render(<AuthPage />);

		const createButton = screen.getByRole("button", { name: "Create account" });
        await user.click(createButton);

        expect(screen.getByText(/Already have an account\?/)).toBeInTheDocument();

        // There are two Sign in buttons:
        //  1. The Sign in tab
        //  2. The bottom Sign in button
        // Select the bottom one specifically.
        const signInButtons = screen.getAllByRole("button", { name: "Sign in" });
        await user.click(signInButtons[signInButtons.length - 1]);

        expect(screen.getByTestId("login-form")).toBeInTheDocument();

        expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    });


	// ---------- SELECTED TAB TESTS ----------

    it("Marks Sign in as selected by default", () => {
        render(<AuthPage />);

        const signInTabs = screen.getAllByRole("button", { name: "Sign in" });

        const createAccountTab = screen.getByRole("button", { name: "Create account" });

        expect(signInTabs[0]).toHaveClass("selected");

        expect(createAccountTab).not.toHaveClass("selected");
    });


    it("Updates the selected tab when Create account is clicked", async () => {
        const user = userEvent.setup();

        render(<AuthPage />);

        const createAccountTab = screen.getByRole("button", { name: "Create account" });

        await user.click(createAccountTab);

        expect(createAccountTab).toHaveClass("selected");

        const signInTabs = screen.getAllByRole("button", { name: "Sign in"});
            
        expect(signInTabs[0]).not.toHaveClass("selected");
    });
});