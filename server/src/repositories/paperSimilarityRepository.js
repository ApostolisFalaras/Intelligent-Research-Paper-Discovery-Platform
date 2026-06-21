import pool from "./../config/db.js";

export async function replacePaperSimilarityCache(paperId, similarPapers) {
	const client = await pool.connect();

	// The deletion and replacement/insertion operations must happen inside a single transaction
	// That's why we need to establish a separate connection, because pool.query uses different
	// connections each time it's called
	try {
		await client.query("BEGIN");

		await client.query("DELETE FROM paper_similarity_cache WHERE paper_id = $1", [paperId]);

		if (similarPapers.length > 0) {
			const values = [];
			const placeholders = similarPapers.map((paper, index) => {
				const i = index * 4;
				values.push(
					paperId, 
					paper.similar_paper_id,
					paper.similarity_score,
					paper.reason
				);

				return `($${i+1}, $${i+2}, $${i+3}, $${i+4}, CURRENT_TIMESTAMP)`;
			});

			await client.query(
				`
				INSERT INTO paper_similarity_cache (
					paper_id, similar_paper_id, similarity_score, reason, updated_at
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

// Fetches similar paper recommendations for the current paper
export async function fetchPaperSimilarityCache(paperId) {
	const sqlQuery = `
		SELECT *
		FROM paper_similarity_cache
		WHERE paper_id = $1
		ORDER BY similarity_score DESC;
	`;

	const results = await pool.query(sqlQuery, [paperId]);
	return results.rows;
}

// It fetches the top "limit" paper recommendations for the current paper
export async function fetchTopSimilarPapers(paperId, limit = 20) {
	const sqlQuery = `
		SELECT *
		FROM paper_similarity_cache
		WHERE paper_id = $1
		ORDER BY similarity_score DESC
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [paperId, limit]);
	return results.rows;
}

// Delete the similarity scores when the paper is deleted from the database
export async function deletePaperSimilarityCache(paperId) {
	const sqlQuery = `
		DELETE FROM paper_similarity_cache
		WHERE paper_id = $1;
	`;

	const result = await pool.query(sqlQuery, [paperId]);
	return result.rowCount;
}

// Fetches a paper's recommendation features
export async function fetchPaperRecommendationFeatures(paperId) {
	const sqlQuery = `
		SELECT *
		FROM paper_recommendation_features
		WHERE paper_id = $1;
	`;

	const results = await pool.query(sqlQuery, [paperId]);
	return results.rows[0] ?? null;
}