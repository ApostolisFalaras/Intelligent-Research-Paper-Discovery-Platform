import { useState } from "react";
import "../../styles/auth.css";

function TextInput({ type, value, placeholder, onChange, autoComplete, hasError  }) {
	// Focused input element state
	const [focused, setFocused] = useState(false);

	// Plain text input field for login username and (non-password) registration fields
	return (
		<input
			type={type}
			value={value}
			placeholder={placeholder}
			className={`text-input ${hasError ? "has-error" : focused ? "focused" : ""}`}
			onChange={(event) => onChange(event.target.value)}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			autoComplete={autoComplete}
		/>
	);
}

export default TextInput;