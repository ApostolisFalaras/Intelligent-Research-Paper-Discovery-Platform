import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import Field from "./Field.jsx";
import PasswordInput from "./PasswordInput.jsx";
import TextInput from "./TextInput.jsx";
import "../../styles/auth.css";

/* Login form retains as state:
 i) the form fields
 ii) the errors associated with each field
 iii) the server errors that might occur during form submission
 iv) the loading state after clicking the submit button
*/
function LoginForm() {
	const [form, setForm] = useState({ username: "", password: ""});
	const [errors, setErrors] = useState({});
	const [serverError, setServerError] = useState("");
	const [loading, setLoading] = useState(false);
	
	// Navigation back to home page after successful login
	const navigate = useNavigate();

	// Update user content value after successful login
	const { refreshUser } = useAuth();

	// Validate form inputs. If empty set corresponding error fields 
	function validateInputs() {
		const e = {};

		if (!form.username.trim()) {
			e.username = "Username is required.";
		}
		if (!form.password.trim()) {
			e.password = "Password is required";
		}

		setErrors(e);
		return Object.keys(e).length === 0;
	}

	// Submit form credentials in backend "POST /api/auth/login" route
	async function handleSubmit(event) {
		event.preventDefault();

		if (!validateInputs())
			return;

		setLoading(true);
		setServerError("");
		
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					username: form.username,
					password: form.password
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || "Unable to sign in.");
			}
			
			// After authentication, retrieve all user info from with the 
			// "GET /api/users/me" request
			const authenticatedUser = await refreshUser();

			if (!authenticatedUser) {
				throw new Error("Login succeeded, but the authenticated user could not be loaded.");
			} 
			
			navigate("/");
		} catch (error) {
			setServerError(error.message || "Unable to sign in");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form 
			id="login-form"
			onSubmit={handleSubmit}
		>
			{/* Server error if the form cannot be submitted successfully */}
			{serverError && (
				<div className="server-error-alert">
					<AlertCircle size={13} className="alert-circle" /> {serverError}
				</div>
			)}

			{/* Form Fields section */}
			
			<Field label="Username" required error={errors.username}>
				<TextInput 
					type="text"
					value={form.username}
					placeholder="johndoe12345"
					autoComplete="username"
					onChange={(username) => 
						setForm(prev => ({
							...prev,
							username,
						})
					)}
					hasError={!!errors.username}
				/>
			</Field>
			
			{/* Password login field */}
			<Field label="Password" required error={errors.password}>
				<PasswordInput 
					value={form.password}
					placeholder="Your password"
					autoComplete="current-password"
					onChange={(password) =>
						setForm((prev) => ({
							...prev,
							password
						})
					)}
					hasError={!!errors.password}
				/>
			</Field>

			<div className="forgot-password">
				<button type="button">Forgot Password?</button>
			</div>

			{/* Login button that submits the credentials to the backend route */}
			<button 
				type="submit" 
				disabled={loading} 
				id="login-btn"
				className={loading && "loading"}
			>
				{loading ? "Signing in..." : "Sign in"}
			</button>
		</form>
	);
}

export default LoginForm;