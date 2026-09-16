import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import NavBar from "../../../src/components/common/NavBar.jsx";


// Mocking user's authentication state
let mockUser = null;
let mockAuthLoading = false;

vi.mock("../../../src/hooks/useAuth.jsx", () => ({
	useAuth: () => ({
		user: mockUser,
		authLoading: mockAuthLoading
	})
}));


// Mocking inner elements
vi.mock("../../../src/components/common/AppLabel.jsx", () => ({
	default: () => (
		<div data-testid="app-label">
			Scholaris
		</div>
	)
}));

vi.mock("../../../src/components/common/InitialsAvatar.jsx", () => ({
	default: ({ initials, avatarURL, variant }) => (
		<div 
			data-testid="initials-avatar"
			data-initials={initials}
			data-avatar-url={avatarURL ?? ""}
			data-variant={variant}
		/>
	)
}));

vi.mock("../../../src/components/search/SearchBar.jsx", () => ({
	default: ({ variant }) => (
		<div 
			data-testid="search-bar"
			data-variant={variant}
		/>
	)
}));


describe("NavBar", () => {
	beforeEach(() => {
        vi.clearAllMocks();

        mockUser = null;
        mockAuthLoading = false;
    });


	// ---------- RENDERING TESTS ----------

	it("Renders public navigation links for an unauthenticated user", () => {
        render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Explore" })).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "My Library" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
    });


	it("Renders authenticated navigation links for a logged-in user", () => {
        mockUser = {
            firstName: "John",
            lastName: "Doe"
        };

        render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(screen.getByRole("link", { name: "Search" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Explore" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "My Library" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    });


	it("Shows Sign in for an unauthenticated user", () => {
        render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        const signIn = screen.getByRole("link", { name: "Sign in" });

        expect(signIn).toHaveAttribute("href", "/auth");
    });


	it("Shows the user's avatar when authenticated", () => {
        mockUser = {
            firstName: "John",
            lastName: "Doe",
            avatarURL: "/avatars/john.jpg"
        };

        render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        const avatar = screen.getByTestId("initials-avatar");
        expect(avatar).toHaveAttribute("data-initials", "JD");
        expect(avatar).toHaveAttribute("data-avatar-url", "/avatars/john.jpg");

        expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    });


	it("Uses the light avatar variant on the home page", () => {
        mockUser = {
            firstName: "John",
            lastName: "Doe"
        };

        render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(screen.getByTestId("initials-avatar")).toHaveAttribute("data-variant", "light");
    });


	it("Uses the dark avatar variant outside the home page", () => {
        mockUser = {
            firstName: "John",
            lastName: "Doe"
        };

        render(
			<MemoryRouter initialEntries={["/search"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(screen.getByTestId("initials-avatar")).toHaveAttribute("data-variant", "dark");
    });


	it("Shows the navbar search bar outside the home and auth pages", () => {
        render(
			<MemoryRouter initialEntries={["/explore"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(screen.getByTestId("search-bar")).toHaveAttribute("data-variant", "navbar");
    });


    it("Does not show the navbar search bar on the home page", () => {
        render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
    });


	it("Shows Back to home instead of navigation controls on the auth page", () => {
        render(
			<MemoryRouter initialEntries={["/auth"]}>
				<NavBar />
			</MemoryRouter>
		);

        const backHome = screen.getByRole("link", { name: /back to home/i });
        expect(backHome).toHaveAttribute("href", "/");

        expect(screen.queryByTestId("search-bar")).not.toBeInTheDocument();
        
		expect(screen.queryByRole("link", { name: "Search" })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    });


	it("Shows loading placeholders while authentication is loading", () => {
        mockAuthLoading = true;

        const { container } = render(
			<MemoryRouter initialEntries={["/"]}>
				<NavBar />
			</MemoryRouter>
		);

        expect(container.querySelector("#navbar-menu-placeholder")).toBeInTheDocument();
        expect(container.querySelector("#navbar-auth-placeholder")).toBeInTheDocument();

        expect(screen.queryByRole("link", { name: "Sign in" })).not.toBeInTheDocument();
    });
});

