import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "../../styles/auth.css";

function PasswordInput({ value, placeholder, onChange, hasError, autoComplete }) {
	// State for viewing actual typed password
	const [show, setShow] = useState(false);

	// Focused input element state
	const [focused, setFocused] = useState(false);

	return (
		<div className={`password-container ${hasError ? "has-error" : focused ? "focused" : ""}`}>
			<input 
				type={show ? "text" : "password"}
				value={value}
				placeholder={placeholder}
				className="password-input"
				onChange={(event) => onChange(event.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				autoComplete={autoComplete}
			/>

			{/* The password input is enclosed in a div that appears like a plain input element,
			in order to include the Eye icon */}
			<button
				type="button" 
				className="password-eye"
				onClick={() => setShow(prev => !prev)}
			>
				{show ? <EyeOff size={14} /> : <Eye size={14} />}
			</button>
		</div>
	);
}

export default PasswordInput;