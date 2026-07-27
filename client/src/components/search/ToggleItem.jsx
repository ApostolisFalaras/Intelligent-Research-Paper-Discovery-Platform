import { useState } from "react";
import "../../styles/search.css";

function CheckItem({ label, sublabel, checked, onChange }) {

	return (
		<label className="toggle-div">
			<div>
				<span className="toggle-label">{label}</span>
				{sublabel && (
					<span className="toggle-sublabel">{sublabel}</span>
				)}
			</div>
			<div 
				className={`toggle-switch-container ${checked ? "checked" : ""}`}
				onClick={() => onChange(!checked)}
			>
				<div className={`toggle-switch ${checked ? "checked" : ""}`} />
			</div>
		</label>
	);
}

export default CheckItem;