import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "../../../src/hooks/useAuth.jsx";

import ProtectedRoute from "../../../src/components/auth/ProtectedRoute.jsx";

vi.mock("../../../src/hooks/useAuth.jsx", () => ({
	useAuth: vi.fn()
}));


describe("ProtectedRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ---------- AUTH LOADING STATE ----------

	it("shows a loading state while authentication is being checked", () => {
		useAuth.mockReturnValue({
			user: null,
			authLoading: true
		});

		render(
			<MemoryRouter initialEntries={["/my-profile"]}>
				<Routes>
					<Route
						path="/my-profile"
						element={
							<ProtectedRoute>
								<div>Protected content</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/auth" element={<div>Auth page</div>} />
				</Routes>
			</MemoryRouter>
		);

		expect(screen.getByText("Loading...")).toBeInTheDocument();
		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
		expect(screen.queryByText("Auth page")).not.toBeInTheDocument();
	});


	it("redirects an unauthenticated user to the auth page", () => {
		useAuth.mockReturnValue({
			user: null,
			authLoading: false
		});

		render(
			<MemoryRouter initialEntries={["/my-profile"]}>
				<Routes>
					<Route 
						path="/my-profile"
						element={
							<ProtectedRoute>
								<div>Protected content</div>
							</ProtectedRoute>
						}
					/>
					<Route path="/auth" element={<div>Auth page</div>}/>
				</Routes>
			</MemoryRouter>
		);

		expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
		expect(screen.getByText("Auth page")).toBeInTheDocument();
		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});


	it("renders the protected content for an authenticated user", () => {
        useAuth.mockReturnValue({
            user: { id: 40, username: "demo_user_40" },
            authLoading: false
        });

        render(
            <MemoryRouter initialEntries={["/my-profile"]}>
                <Routes>
                    <Route
                        path="/my-profile"
                        element={
                            <ProtectedRoute>
                                <div>Protected content</div>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/auth" element={<div>Auth page</div>} />
                </Routes>
            </MemoryRouter>
        );

		expect(screen.getByText("Protected content")).toBeInTheDocument();
		expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
        expect(screen.queryByText("Auth page")).not.toBeInTheDocument();
    });
});