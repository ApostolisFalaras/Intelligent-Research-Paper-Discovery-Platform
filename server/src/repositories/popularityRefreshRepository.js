import pool from "./../config/db.js";

// Increments global popularity scores as stale after each user-paper interaction
export async function markPopularityDirty() {
	const sqlQuery = `
		UPDATE popularity_refresh_state
		SET 
		    pending_event_count = pending_event_count + 1,
		    last_event_at = CURRENT_TIMESTAMP
		WHERE id = 1;
	`;

	await pool.query(sqlQuery);
}

// Fetch current popularity refresh state
export async function fetchPopularityRefreshState() {
	const sqlQuery = `
		SELECT pending_event_count, last_event_at, last_refresh_at
		FROM popularity_refresh_state
		WHERE id = 1;
	`;

	const result = await pool.query(sqlQuery);
	return result.rows[0];
}

// Marks a popularity refresh as complete
export async function markPopularityRefreshComplete(processedEventCount) {
	const sqlQuery = `
		UPDATE popularity_refresh_state
		SET
			pending_event_count = GREATEST(pending_event_count - $1, 0),
			last_refresh_at = CURRENT_TIMESTAMP
		WHERE id = 1;
	`;

	await pool.query(sqlQuery, [processedEventCount]);
}