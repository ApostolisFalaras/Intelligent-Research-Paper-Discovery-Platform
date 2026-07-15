import { useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check, X } from "lucide-react";
import Field from "./Field.jsx";
import PasswordInput from "./PasswordInput.jsx";
import TextInput from "./TextInput.jsx";
import "../../styles/auth.css";

const userRoles = [
	"PhD Student",
	"Postdoctoral Research",
	"Assistant Professor",
	"Associate Professor",
	"Full Professor",
	"Research Scientist",
	"Industry Researcher",
	"Independent Researcher",
	"Undergraduate Student",
	"Master's Student",
];

/* Sign-up form retains as state:
 i) the form fields
 ii) the errors associated with each field
 iii) the server errors that might occur during form submission
 iv) the loading state after clicking the submit button
 v) the strength of the inserted password
*/
function SignupForm() {
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		username: "", 
		email: "",
		password: "",
		confirmPassword: "",
		affiliation: "",
		role: ""
	});
	const [errors, setErrors] = useState({});
	const [serverError, setServerError] = useState("");
	const [loading, setLoading] = useState(false);
	
	// Navigation back to home page after successful login
	const navigate = useNavigate();

	// Update user content value after successful login
	const { refreshUser } = useAuth();


	/* Input Form Field Validation */

	// Estimate password strength using heuristic scoring conditions,
	// based on the password length, and existence of letters, ditigs, and other special characters
	function passwordStrength(password) {
		let score = 0;
		if (password.length > 8) score++;
		if (password.length > 12) score++;
		if (/[A-Z]/.test(password)) score++;
		if(/[0-9]/.test(password)) score++;
		if(/[^a-zA-Z0-9]/.test(password)) score++;

		// "type" is assigned as a class in the strength-bar elements
		if (score === 1)
			return { label: "Weak", type: "weak" }
		else if (score === 2)
			return { label: "Fair", type: "fair" }
		else if (score === 3)
			return { label: "Good", type: "good" }
		else if (score === 4)
			return { label: "Strong", type: "strong" }
		else 
			return { label: "Very Strong", type: "very-strong" }
	} 

	const strength = passwordStrength(form.password);

	// Validate username & email structure
	function validateUsername(username) {
		return /^[a-zA-Z0-9_]{3,20}$/.test(username);
	}

	function validateEmail(email) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	// Validate form inputs. If empty set corresponding error fields 
	function validateInputs() {
		const e = {};

		if (!form.firstName.trim()) 
			e.first_name = "First name is required.";

		if (!form.lastName.trim()) 
			e.last_name = "Last name is required.";

		if (!validateUsername(form.username))
			e.username = "3–20 characters, letters, numbers, and underscores only.";

		if (!validateEmail(form.email)) 
			e.email = "Enter a valid email address.";

		if (form.password.length < 8) 
			e.password = "At least 8 characters required.";

		if (form.password !== form.confirmPassword)
			e.confirm_password = "Passwords do not match.";
    
		setErrors(e);
		return Object.keys(e).length === 0;
	}

	// Submit form credentials in backend "POST /api/auth/register" route
	async function handleSubmit(event) {
		event.preventDefault();

		if (!validateInputs())
			return;

		setLoading(true);
		setServerError("");
		
		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					firstName: form.firstName,
					lastName: form.lastName,
					username: form.username,
					email: form.email,
					password: form.password,
					affiliation: form.affiliation || null,
					role: form.role || null
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

			<div id="form-name-fields">
				<Field label="First Name" required error={errors.firstName}>
					<TextInput 
						type="text"
						value={form.firstName}
						placeholder="John"
						autocomplete="first-name"
						onChange={(firstName) => 
							setForm((prev) => ({
								...prev,
								firstName
							})
						)}
						hasError={!!errors.firstName}
					/>
				</Field>

				<Field label="Last Name" required error={errors.lastName}>
					<TextInput 
						type="text"
						value={form.lastName}
						placeholder="Doe"
						autocomplete="last-name"
						onChange={(lastName) => 
							setForm((prev) => ({
								...prev,
								lastName
							})
						)}
						hasError={!!errors.lastName}
					/>
				</Field>
			</div>

			<Field label="Username" required hint="3-20 characters, letters, numbers, underscores." error={errors.username}>
				<TextInput 
					type="text"
					value={form.username}
					placeholder="johndoe12345"
					autoComplete="username"
					onChange={(username) =>
						setForm((prev) => ({
							...prev,
							username
						}))
					}
					hasError={!!errors.username}
				/>
			</Field>

			<Field label="Email Address" required error={errors.email}>
				<TextInput 
					type="text"
					value={form.email}
					placeholder="johndoe@email.com"
					autoComplete="email"
					onChange={(email) =>
						setForm((prev) => ({
							...prev,
							email
						}))
					}
					hasError={!!errors.email}
				/>
			</Field>

			<Field label="Password" required error={errors.password}>
				<PasswordInput 
					value={form.password}
					placeholder="At least 8 characters"
					autoComplete="current-password"
					onChange={(password) => 
						setForm((prev) => ({
							...prev,
							password
						})
					)}
					hasError={!!errors.password}
				/>

				{/* Estimation for Password Strength */}
				{ 
					form.password.length > 0 && (
						<div id="strength-bar-container">
							<div id="strength-bar">
								<div id="strength-bar-fill" className={strength.type || ""}/>
							</div>

							<span id="strength-estimation" className={strength.type || ""}>
								{strength.label}
							</span>
						</div>
					)
				}
			</Field>

			<Field label="Confirm Password" required error={errors.confirmPassword}>
				<PasswordInput 
					value={form.confirmPassword}
					placeholder="Confirm your password"
					autoComplete="confirm-password"
					onChange={(confirmPassword) => 
						setForm((prev) => ({
							...prev,
							confirmPassword
						})
					)}
					hasError={!!errors.confirmPassword}
				/>

				{/* Indication for matching/non-matching Passwords */}
				{
					!errors.confirmPassword && 
					form.confirmPassword.length > 0 && 
					(form.password === form.confirmPassword ? (
						<span id="passwords-match">
							<Check size={12} /> Passwords match
						</span>
					) :
					(
						<span id="passwords-mismatch">
							<X size={12} /> Passwords don't match
						</span>
					))
				}
			</Field>

			<Field label="Affiliation" hint="University, institution, or company">
				<TextInput 
					type="text"
					value={form.affiliation}
					placeholder="MIT, IBM Research, etc."
					autoComplete="affiliation"
					onChange={(affiliation) =>
						setForm((prev) => ({
							...prev,
							affiliation
						})
					)}
				/>
			</Field>

			<Field label="Role">
				<div id="role-dropdown-container">
					<select 
						id="role-dropdown"
						className={form.role ? "form-role": ""}
						onChange={(event) => 
							setForm((prev) =>({
								...prev,
								role: event.target.value
							})
						)}
					>
						<option value="" disabled>Select your role...</option>
						{userRoles.map((role) => (
							<option key={role} value={role}>{role}</option>
						))}
					</select>
				</div>
			</Field>

			{/* Register button that submits the credentials to the backend route */}
			<button 
				type="submit" 
				disabled={loading} 
				id="login-btn"
				className={loading && "loading"}
			>
				{loading ? "Creating account..." : "Create account"}
			</button>
		</form>
	);
}

export default SignupForm;