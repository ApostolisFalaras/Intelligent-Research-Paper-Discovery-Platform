import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";


function ProtectedRoute({ children }) {
	const { user, authLoading } = useAuth();
	const location = useLocation();

	// Authentication status is pending
	if (authLoading) {
		return (
			<div>
				Loading...
			</div>
		);
	}

	// Authentication check is complete and no user is active
	if (!user) {
		return (
			<Navigate 
				to="/auth"
				replace
				state={{ from: location }}
			/>
		);
	}

	// User is authenticated
	return children;
}

export default ProtectedRoute;