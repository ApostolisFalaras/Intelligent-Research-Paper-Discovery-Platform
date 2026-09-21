import "../../styles/authors.css";

function AuthorLoading() {
    return (
        <div id="author-loading">
            <div id="author-loading-svg">
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
            </div>

            <p id="author-loading-title">
                Loading author profile
            </p>

            <p id="author-loading-msg">
                We're retrieving the author's publications, research areas,
                citation metrics, and profile information.
            </p>
        </div>
    );
}

export default AuthorLoading;