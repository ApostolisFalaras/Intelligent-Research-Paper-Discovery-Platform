import { createContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	// user -> User profile represents the authentication state 
	// authLoading -> Flag marking the authentication process as complete (false) or incomplete (true)
	const [user, setUser] = useState(null);
	const [authLoading, setAuthLoading] = useState(true);

	// Runs once upon application startup
	useEffect(() => {
		async function loadUser() {
			try {
				// "credentials:include" -> sends Cookie: connect.sid=... along with the request
				const res = await fetch("/api/users/me", {
					credentials: "include"
				});

				const result = await res.json();
				// Authenticated User
				setUser(result.data);
			} catch {
				// Unauthenticated User
				setUser(null);
			} finally {
				// Authentication process is completed
				setAuthLoading(false);
			}
		}
	}, []);

	// The auth provider covers the whole application <App />,
	// so that the user is accessible from all components
	return (
		<AuthContext.Provider value={{user, authLoading, setUser }}>
			{children}
		</AuthContext.Provider>
	);
}