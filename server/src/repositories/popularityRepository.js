import pool from "../config/db.js";

// Fetches the min & max values for all recommendation metrics:
// paper views, paper saves, recommendation clicks, citations, recency score
export async function fetchPopularityMetricRanges() {
	const sqlQuery = `
		SELECT 
			MIN(COALESCE(pm.view_count, 0)) AS min_views,
			MAX(COALESCE(pm.view_count, 0)) AS max_views,

			MIN(COALESCE(pm.save_count, 0)) AS min_saves,
			MAX(COALESCE(pm.save_count, 0)) AS max_saves,

			MIN(COALESCE(pm.recommendation_click_count, 0)) AS min_clicks,
			MAX(COALESCE(pm.recommendation_click_count, 0)) AS max_clicks,

			MIN(COALESCE(prf.citation_score, 0)) AS min_citations,
			MAX(COALESCE(prf.citation_score, 0)) AS max_citations,

			MIN(COALESCE(prf.recency_score, 0)) AS min_recency,
			MAX(COALESCE(prf.recency_score, 0)) AS max_recency

			FROM paper_recommendation_features prf
			
			LEFT JOIN paper_metrics pm
			  ON pm.paper_id = prf.paper_id;
	`;

	const result = await pool.query(sqlQuery);
	return result.rows[0];
}

// Fetches a popularity batch starting from a particular paper id
export async function fetchPopularityBatch(lastPaperId, limit) {
	const sqlQuery = `
		SELECT 
			prf.paper_id,
			COALESCE(pm.view_count, 0) AS view_count,
			COALESCE(pm.save_count, 0) AS save_count,
			COALESCE(pm.recommendation_click_count, 0) AS recommendation_click_count,
			COALESCE(prf.citation_score, 0) AS citation_score,
			COALESCE(prf.recency_score, 0) AS recency_score
		
		FROM paper_recommendation_features prf
		
		LEFT JOIN paper_metrics pm
		  ON pm.paper_id = prf.paper_id

		WHERE prf.paper_id > $1
		
		ORDER BY prf.paper_id
		
		LIMIT $2;
	`;

	const result = await pool.query(sqlQuery, [lastPaperId, limit]);
	return result.rows;
}

// Bulk-updates popularity scores for a batch
export async function upsertPopularityScores(scores) {
	if (scores.length === 0) {
		return 0;
	}

	const values = [];

	// Construct $-placeholders
	const placeholders = scores.map((score, index) => {
		const i = index * 2;

		values.push(score.paperId, score.popularityScore);
		
		return `($${i + 1}, $${i + 2})`;
	});

	const sqlQuery = `
		INSERT INTO paper_metrics (paper_id, popularity_score)
		VALUES ${placeholders.join(", ")}
		
		ON CONFLICT (paper_id) DO UPDATE SET
			popularity_score = EXCLUDED.popularity_score,
			updated_at = CURRENT_TIMESTAMP;
	`;

	const result = await pool.query(sqlQuery, values);

	return result.rowCount;
} 