import pool from "./../config/db.js";

// It fetches "limit" candidate papers based on a user's most preferred topics
// It's used for content-based & hybrid recommendation scores
export async function fetchCandidatePapersByTopics(topicIds, limit = 5000) {
	const sqlQuery = `
		SELECT prf.*
		FROM paper_recommendation_features prf
		JOIN paper_topics pt
		  ON pt.paper_id = prf.paper_id
		WHERE pt.topic_openalex_id = ANY($1)
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [topicIds, limit]);
	return results.rows;
}

// It fetches "limit" candidate papers based on a user's most preferred subfields
// It's used for content-based & hybrid recommendation scores
export async function fetchCandidatePapersBySubfields(subfieldIds, limit = 5000) {
	const sqlQuery = `
		SELECT prf.*
		FROM paper_recommendation_features prf
		JOIN paper_topics pt
		  ON pt.paper_id = prf.paper_id
		WHERE pt.subfield_openalex_id = ANY($1)
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [subfieldIds, limit]);
	return results.rows;
}

// It fetches "limit" candidate papers that similar users interacted with
// It's used for collaborative & hybrid recommendation scores
export async function fetchCandidatePapersFromSimilarUsers(userId, limit = 5000) {
	const sqlQuery = `
		SELECT
			upi.user_id,
			upi.paper_id,
			upi.view_count,
			upi.is_saved,
			upi.interest_score,
			usc.similarity_score
		FROM user_similarity_cache usc
		JOIN user_paper_interactions upi
		  ON upi.user_id = usc.other_user_id
		WHERE usc.user_id = $1
		  AND upi.paper_id NOT IN (
		  	SELECT paper_id
			FROM user_paper_interactions
			WHERE user_id = $1
		  )
		ORDER BY usc.similarity_score DESC, upi.interest_score DESC
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [userId, limit]);
	return results.rows;
}

// It fetches "limit" candidate papers that are similar to the papers the user saved in folders
// It's used for similar-to-saved-paper, home, hybrid recommendation scores
export async function fetchCandidatePapersFromSavedPaper(userId, limit = 5000) {
	const sqlQuery = `
		SELECT DISTINCT
			psc.similar_paper_id,
			psc.similarity_score,
			psc.reason
		FROM user_paper_interactions upi
		JOIN paper_similarity_cache psc
		  ON psc.paper_id = upi.paper_id
		WHERE upi.user_id = $1
		  AND upi.is_saved = true
		  AND psc.similar_paper_id NOT IN (
		  	SELECT paper_id
			FROM user_paper_interactions
			WHERE user_id = $1
		  )
		ORDER BY similarity_score DESC,
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [userId, limit]);
	return results.rows;
}

// It fetches "limit" most popular papers based on the popularity score, stored in the paper metrics.
// It's used for popular paper, cold-start, & fallback recommendations
export async function fetchCandidatePopularPapers(limit = 1000) {
	const sqlQuery = `
		SELECT prf.*
		FROM paper_recommendation_features prf
		LEFT JOIN paper_metrics pm
		  ON prf.paper_id = p.paper_id
		ORDER BY
			COALESCE(pm.popularity_score, 0) DESC,
			prf.citation_score DESC
		LIMIT $1; 
	`;

	const results = await pool.query(sqlQuery, [limit]);
	return results.rows;
}

// It fetches "limit" most recent papers based on the recency score, stored in the paper metrics.
// It's used for recent paper, cold-start, & fallback recommendations
export async function fetchCandidateRecentPapers(limit = 1000) {
	const sqlQuery = `
		SELECT prf.*
		FROM paper_recommendation_features prf
		ORDER BY prf.recency_score DESC
		LIMIT $1; 
	`;

	const results = await pool.query(sqlQuery, [limit]);
	return results.rows;
}

// It fetches "limit" most similar papers to the currently viewed paper
// It's used for similar-paper recommendations
export async function fetchCandidatePapersForPaperSimilarity(paperId, limit = 10000) {
	const sqlQuery = `
		SELECT DISTINCT prf.*
		FROM paper_recommendation_features prf
		JOIN paper_topics pt_candidate
		  ON pt_candidate.paper_id = prf.paper_id
		JOIN paper_topics pt_source
		  ON pt_source.topic_openalex_id = pt_candidate.topic_openalex_id
		WHERE pt_source.paper_id = $1
		  AND prf.paper_id <> $1
		LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [paperId, limit]);
	return results.rows;
}

// Helper repository function that fetches all paper ids a user has interacted with
// when the service method wants to use the ids as a set of ids to not process.
export async function fetchExcludedPaperIds(userId) {
	const sqlQuery = `
		SELECT paper_id
		FROM user_paper_interactions
		WHERE user_id = $1;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows.map(row => Number(row.paper_id));
}