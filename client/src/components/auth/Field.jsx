import { AlertCircle } from "lucide-react";
import "../../styles/auth.css";

function Field({ label, namePart, required, children, error, hint }) {

	return (
		<div className="field-container">
			{/* Field label + * (if field is required) */}
			<label className="label">
				{label}
				{required && <span className="required-asterisk">*</span>}
			</label>

			{/* Nested input text field */}
			{children}
			
			{/* Error message that appears if input field is left empty upon form submission */}
			{error && (
				<span className="field-error">
					<AlertCircle size={11} /> {error}
				</span>
			)}

			{/* Form insertion hint/instruction, mainly used for registration fields */}
			{hint && !error && (
				<span className="field-hint">{hint}</span>
			)}
		</div>
	);
}

export default Field;