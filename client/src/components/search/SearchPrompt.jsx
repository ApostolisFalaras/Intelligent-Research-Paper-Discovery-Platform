import { Search } from "lucide-react";
import "../../styles/search.css";

function SearchPrompt() {
    return (
        <div id="search-prompt">
            <div id="search-prompt-svg">
                <Search size={22} strokeWidth={2} />
            </div>

            <p id="search-prompt-title">
                Start your search
            </p>

            <p id="search-prompt-msg">
                Enter a search query above to discover papers, authors, and
                research topics from our collection.
            </p>
        </div>
    );
}

export default SearchPrompt;