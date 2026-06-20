import pool from "./../config/db.js";

// Mark's a user's recommendations as stale
export async function markUserRecommendationsStale(userId, reason = "unknown", priority = 1) {
	const sqlQuery = `
		INSERT INTO recommendation_refresh_queue (
			user_id, reason, priority, requested_at, processed_at
		)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP, NULL)
		ON CONFLICT (user_id, reason) 
		WHERE processed_at IS NULL
		DO UPDATE SET
			request_at = CURRENT_TIMESTAMP,
			priority = GREATEST(recommendation_refresh_queue.priority, EXCLUDED.priority),
			processed_at = NULL;
	`;

	await pool.query(sqlQuery, [userId, reason, priority]);
}

// Fetch users with pending stale recommendations
export async function fetchStaleRecommendations(limit = 50) {
	const sqlQuery = `
		SELECT 
			user_id,
			ARRAY_AGG(reason ORDER BY requested_at DESC) AS reasons,
			MAX(priority) AS priority,
			MIN(requested_at) AS oldest_requested_at,
			MAX(requested_at) AS latest_requested_at
		FROM recommendation_refresh_queue
		WHERE processed_at IS NULL
		GROUP BY user_id
		ORDER BY MAX(priority) DESC, MIN(requested_at) ASC
		LIMIT $1;
	`;

	const result = await pool.query(sqlQuery, [limit]);
	return result.rows;
}

// Mark all pending queue entries for a user as processed
export async function markUserRecommendationsProcessed(userId) {
	const sqlQuery = `
		UPDATE recommendation_refresh_queue
		SET processed_at = CURRENT_TIMESTAMP
		WHERE user_id = $1
		  AND processed_at IS NULL;
	`;

	await pool.query(sqlQuery, [userId]);
}

// Checks whether user has pending refresh queue entries or no recommendation cache
export async function isUserRecommendationCacheStale(userId) {
	const sqlQuery = `
		SELECT EXISTS (
			SELECT 1
			FROM recommendation_refresh_queue
			WHERE user_id = $1
			  AND processed_at IS NULL 
		) AS has_pending_refresh,
		EXISTS (
			SELECT 1
			FROM user_recommendation_cache
			WHERE user_id = $1
		) AS has_cache;
	`;

	const result = await pool.query(sqlQuery, [userId]);
	const row = result.rows[0];

	return row.has_pending_refresh || !row.has_cache;
}