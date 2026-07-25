import "../../styles/search.css";

function FetchError({ fetchError, retrySearchQuery }) {


	return (
		<div id="fetch-error">
			<div id="fetch-error-svg">
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="12" cy="12" r="10"/>
					<line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
				</svg>
			</div>

			<p id="fetch-error-title">Something went wrong</p>
			<p id="fetch-error-msg">
				{fetchError ??  "Could not load results. Check your connection and try again."}
			</p>

			<button 
				type="button"
				id="try-again-btn"
				onClick={() => retrySearchQuery()}
			>
				Try Again
			</button>
		</div>
	);
}

export default FetchError;