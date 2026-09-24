import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronUp, ChevronRight, X } from "lucide-react";
import "../../styles/profile.css";

function getInitials(name = "") {
    return name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function FollowingAuthors({ authors = [], onUnfollow }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const normalizedSearch = search.trim().toLowerCase();

	// Filtered authors after typing in the authors list's search bar
    const filteredAuthors = normalizedSearch
        ? authors.filter((author) =>
            author?.authorName
                ?.toLowerCase()
                .includes(normalizedSearch)
        )
        : authors;

	
    function toggleOpen() {
        setIsOpen((current) => !current);
        setSearch("");
    }

    return (
        <div id="following-authors">
            <div
                id="following-authors-header"
                className={isOpen || authors.length > 0 ? "has-content" : ""}
            >
                <p>
                    Following
                    <span id="total-authors-followed"> {authors.length} </span>
                </p>

                {authors.length > 0 && (
                    <button
                        type="button"
                        id="view-authors-btn"
                        onClick={toggleOpen}
                    >
                        {isOpen ? (
                            <> <ChevronUp size={12} /> Done </>
                        ) : (
                            <> See all <ChevronRight size={12} /> </>
                        )}
                    </button>
                )}
            </div>

            {authors.length === 0 && (
                <p id="no-available-authors">
                    No followed authors yet.
                </p>
            )}

            {/* Collapsed preview */}
            {!isOpen && authors.length > 0 && (
                <div id="followed-authors-container">
                    {authors.slice(0, 3).map((author) => (
                        <div
                            key={author.id}
                            className="followed-author"
                        >
                            <div className="author-initials-container">
                                <span className="author-initials">
                                    {getInitials(author.authorName)}
                                </span>
                            </div>

                            <Link
                                to={`/authors/${author.id}`}
                                className="author-link"
                            >
                                {author.authorName}
                            </Link>
                        </div>
                    ))}

                    {authors.length > 3 && (
                        <p id="authors-hidden">
                            +{authors.length - 3} more
                        </p>
                    )}
                </div>
            )}

            {/* Expanded panel */}
            {isOpen && (
                <>
                    <input
                        autoFocus
                        type="text"
                        id="authors-search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search…"
                    />

                    <div id="authors-list">
                        {filteredAuthors.length === 0 ? (
                            <p id="no-filtered-authors">
                                No results for "{search}"
                            </p>
                        ) : (
                            filteredAuthors.map((author) => (
                                <div
                                    key={author.id}
                                    className="followed-author expanded"
                                >
                                    <div className="author-initials-container">
                                        <span className="author-initials">
                                            {getInitials(author.authorName)}
                                        </span>
                                    </div>

                                    <Link
                                        to={`/authors/${author.id}`}
                                        className="author-link filtered"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {author.authorName}
                                    </Link>

                                    <button
                                        type="button"
                                        className="unfollow-author"
                                        title="Unfollow"
                                        aria-label={`Unfollow ${author.authorName}`}
                                        onClick={() => onUnfollow(author.id)}
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default FollowingAuthors;