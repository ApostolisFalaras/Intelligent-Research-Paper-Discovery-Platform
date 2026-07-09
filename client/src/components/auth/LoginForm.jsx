import { useState } from "react";
import Field from "./Field.jsx";
import PasswordInput from "./PasswordInput.jsx";
import TextInput from "./TextInput.jsx";
import "../../styles/auth.css";

function LoginForm() {
	// State representing the current values of form fields
	const [form, setForm] = useState({ username: "", password: ""});

	// State representing the current errors associated with each field value
	// If any or both form fields are empty, the error fields are set
	const [errors, setErrors] = useState({});

	// State associated with a backend server error
	const [serverError, setServerError] = useState("");

	// Loading state when "Sign in" button is clicked
	const [loading, setLoading] = useState(false);

	// Verify form inputs, specifically if they're empty 
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
	function handleSubmit(event) {
		event.preventDefault();

		if (!validateInputs())
			return;

		setLoading(true);
		setServerError("");
		// TODO: API call
	}

	return (
		<form 
			id="login-form"
			onSubmit={handleSubmit}
		>
			{/* Server error if the form cannot be submitted successfully */}
			{serverError && (
				<div className="server-error-alert">
					<AlertCircle size={13} className="alert-circle" />
				</div>
			)}

			{/* Username login field */}
			<Field label="Username" noValidate required error={errors.username}>
				<TextInput 
					type="text"
					value={form.username}
					placeholder="Your username"
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
			<Field label="Password" noValidate required error={errors.password}>
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