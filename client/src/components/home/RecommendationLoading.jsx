import "../../styles/home.css";

function RecommendationLoading() {
	return (
        <div id="recommendation-loading">
            <div id="recommendation-loading-svg">
                <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C58B00"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </div>

            <p id="recommendation-loading-title">
                Preparing your recommendations
            </p>

            <p id="recommendation-loading-msg">
                We're building personalized recommendations based on your
                interests and activity. This usually takes only a few moments.
            </p>
        </div>
    );
}

export default RecommendationLoading;