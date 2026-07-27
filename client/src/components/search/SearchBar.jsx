import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import "../../styles/search.css";

function SearchBar({ variant }) {
	const [query, setQuery] = useState("");
	const navigate = useNavigate();

	function handleSearch() {
		if (!query.trim())
			return;

		navigate(`/search?query=${encodeURIComponent(query)}`);
	}

	return (
		<div className={`search-bar search-bar-${variant}`}>
			<Search size={18} className="search-icon" />

			<input 
				type="text"
				value={query}
				placeholder="Search papers, authors, topics..."
				className={`search-input search-input-${variant}`}
				onChange={(event) => setQuery(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						handleSearch();
					}
				}}
			/>

			<button
				className={`search-button search-button-${variant}`}
				onClick={handleSearch}
			>
				Search
			</button>
		</div>
		
	);
}

export default SearchBar;