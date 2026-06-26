import { parseUserId, parseInteger } from "./../utils/parseData.js";
import pool from "./../config/db.js";;

// Deletes a user's old similarity cache and replaces it with a new set of similarity score
export async function replaceUserSimilarityCache(userId, similarities) {
	const client = await pool.connect();

	// The deletion and replacement/insertion operations must happen inside a single transaction
	// That's why we need to establish a separate connection, because pool.query uses different
	// connections each time it's called
	try {
		await client.query("BEGIN");

		await client.query(
			`DELETE FROM user_similarity_cache WHERE user_id = $1;`,
			[userId]
		);

		if (similarities.length > 0) {
			const values = [];

			const placeholders = similarities.map((sim, index) => {
				const i = index * 3;

				values.push(userId, sim.similarUserId, sim.similarityScore);

				// Assigning a unique placeholder values for each individual value
				// of all similarity objects 
				return `($${i+1}, $${i+2}, $${i+3}, CURRENT_TIMESTAMP)`;
			});

			await client.query(
				`
				INSERT INTO user_similarity_cache (
					user_id, similar_user_id, similarity_score, updated_at
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

// Fetches all similarities related to a user from the cache
export async function fetchUserSimilarities(userId) {
	const sqlQuery = `
		SELECT *
		FROM user_similarity_cache
		WHERE user_id = $1
		ORDER BY similarity_score DESC;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows;
}

// Fetches the top "limit" similarities related to a user from the cache
export async function fetchTopSimilarUsers(userId, limit = 20) {
	const sqlQuery = `
		SELECT *
		FROM user_similarity_cache
		WHERE user_id = $1
		ORDER BY similarity_score DESC
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [userId, limit]);
	return results.rows;
}

// Deletes all user similarity scores associated with a user, when a user deletes their profile
export async function deleteUserSimilarityCache(userId) {
	const sqlQuery = `
		DELETE FROM user_similarity_cache
		WHERE user_id = $1;
	`;

	const result = await pool.query(sqlQuery, [userId]);
}