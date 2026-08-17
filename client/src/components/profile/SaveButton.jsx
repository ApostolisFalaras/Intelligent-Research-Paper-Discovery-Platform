import { Check } from "lucide-react";
import "../../styles/profile.css";

function SaveButton({ onClick, saved, loading, }) {

	return (
		<button
			className="save-btn"
			onClick={onClick}
			disabled={loading}
		>
			{saved 
				? <> <Check size={13} /> Saved </> 
				: loading
					? "Saving..."
					: "Save changes"
			}
		</button>
	);
}

export default SaveButton;