import pool from "./../config/db.js";

export async function replaceUserRecommendationCache(userId, recommendations) {
	const client = await pool.connect();

	// The deletion and replacement/insertion operations must happen inside a single transaction
	// That's why we need to establish a separate connection, because pool.query uses different
	// connections each time it's called
	try {
		await client.query("BEGIN");

		await client.query(
			"DELETE FROM user_recommendation_cache WHERE user_id = $1",
			[userId]
		);

		if (recommendations.length > 0) {
			const values = [];
			const placeholders = recommendations.map((recom, index) => {
				const i = index * 9;
				values.push(
					userId, 
					recom.paperId,
					recom.finalScore,
					recom.contentScore,
					recom.collaborativeScore,
					recom.topicScore,
					recom.popularityScore,
					recom.recencyScore,
					recom.reason,
				);
				
				return `($${i+1}, $${i+2}, $${i+3}, $${i+4}, $${i+5}, 
				 		 $${i+6}, $${i+7}, $${i+8}, $${i+9}, CURRENT_TIMESTAMP)`
			});

			await client.query(
				`
				INSERT INTO user_recommendation_cache (
					user_id, paper_id, final_score, content_score, collaborative_score, topic_score,
					popularity_score, recency_score, reason, updated_at
				)
				VALUES ${placeholders.join(", ")};
				`,
				values
			);
		}

		await client.query("COMMIT");
	} 
	catch (error) {
		// If there's any error that crashes the transaction, we roll it back, to undo its changes
		await client.query("ROLLBACK");
		throw error;
	}
	finally {
		// We close the client upon completion (successful or not) of the transaction
		client.release();
	}
}

// Fetches all paper recommendations related to a user from the cache
export async function fetchUserRecommendationCache(userId) {
	const sqlQuery = `
		SELECT *
		FROM user_recommendation_cache
		WHERE user_id = $1
		ORDER BY final_score DESC;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows;
}

// Fetches all paper recommendation of a particular type related to a user from the cache
export async function fetchUserRecommendationCacheByReason(userId, reason, limit = 20) {
	const sqlQuery = `
		SELECT *
		FROM user_recommendation_cache
		WHERE user_id = $1
		  AND reason = $2
		ORDER BY final_score DESC
		LIMIT $3;
	`;

	const results = await pool.query(sqlQuery, [userId, reason, limit]);
	return results.rows;
}

// Deletes all recommendations associated with a user, when a user deletes their profile
export async function deleteUserRecommendationCache(userId) {
	const sqlQuery = `
		DELETE FROM user_recommendation_cache
		WHERE user_id = $1;
	`;

	const result = await pool.query(sqlQuery, [userId]);
	return result.rowCount;
}