import { createContext, useCallback, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	// user -> User profile represents the authentication state 
	// authLoading -> Flag marking the authentication process as complete (false) or incomplete (true)
	const [user, setUser] = useState(null);
	const [authLoading, setAuthLoading] = useState(true);

 
	/* Helper that retrieves the whole user tuple from the database,
	   and stores it in the authentication context */
	const refreshUser = useCallback(async () => {
		try {
			const response = await fetch("/api/users/me", {
				credentials: "include"
			});

			if (!response.ok) {
				setUser(null);
				return null;
			}

			const result = await response.json();

			console.log("GET /api/users/me status:", response.status);
			console.log("GET /api/users/me response:", result);

			const authenticatedUser = result.data ?? null;

			setUser(authenticatedUser);
			return authenticatedUser;
			
		} catch (error) {
			console.error("Failed to load authenticated user:", error);

			setUser(null);
			return null;
		}
	}, []);

	// Runs once upon application startup and tries to fetch the user data
	useEffect(() => {
		async function initializeAuth() {
			try {
				await refreshUser();
			} finally {
				// Authentication process is completed
				setAuthLoading(false);
			}
		}

		initializeAuth();
	}, [refreshUser]);

	/* Logout utility included in the context since it updates the authenticated status */
	async function logout() {
		try {
			const response = await fetch("/api/auth/logout", {
				method: "POST",
				credentials: "include"
			});

			if (!response.ok) {
				throw new Error("Logout request failed.");
			}

			setUser(null);
		} catch (error) {
			console.error("Failed to log out:", error);
			throw error;
		}
	}

	/* The auth provider covers the whole application <App />, 
	 so that the user is reachable from all components */
	return (
		<AuthContext.Provider value={{user, authLoading, setUser, refreshUser, logout }}>
			{children}
		</AuthContext.Provider>
	);
}