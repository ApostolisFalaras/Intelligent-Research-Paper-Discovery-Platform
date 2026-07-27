import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import "../../styles/search.css";

function FilterSection({ title, children }) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className="filter-section">

			{/* Filter header */}
			<button 
				className="filter-title-btn"
				onClick={() => setIsOpen(!isOpen)}
			>
				{title}
				{isOpen ? 
					<ChevronUp size={13} style={{color: "#9B9B8A"}} /> :
					<ChevronDown size={13} style={{color: "#9B9B8A"}} />
				}
			</button>

			{/* Nested filter elements */}
			{isOpen && (
				<div className="filter">
					{children}
				</div>
			)}
		</div>
	);
} 

export default FilterSection;