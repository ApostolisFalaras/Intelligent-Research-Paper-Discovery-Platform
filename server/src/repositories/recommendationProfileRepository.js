import pool from "./../config/db.js";

// Fetch a user's interaction with any papers, along with the paper recommendation data
// Added subquery that fetches the number of folders a paper is saved in 'saved_folder_count'
export async function fetchUserInteractionRows(userId) {
	const sqlQuery = `
		SELECT
			upi.user_id,
			upi.paper_id,
			upi.view_count,
			upi.is_saved,
			upi.last_interaction_at,

			COALESCE(folder_data.saved_folder_count, 0) AS saved_folder_count,

			prf.topic_vector,
			prf.domain_vector,
			prf.field_vector,
			prf.subfield_vector,
			prf.author_vector,
			prf.keyword_vector,
			prf.citation_score,
			prf.recency_score

		FROM user_paper_interactions upi
		
		JOIN paper_recommendation_features prf 
		  ON upi.paper_id = prf.paper_id 

		LEFT JOIN LATERAL (
			SELECT COUNT(*) AS saved_folder_count
			FROM user_folder_papers ufp
			JOIN user_folders uf
			  ON uf.id = ufp.folder_id
			WHERE uf.user_id = upi.user_id
			  AND ufp.paper_id = upi.paper_id
		) folder_data ON true

		WHERE upi.user_id = $1
		
		ORDER BY upi.last_interaction_at DESC;
	`;

	const result = await pool.query(sqlQuery, [userId]);
	return result.rows;
}

// Checks if user has any paper interactions
export async function fetchUserInteractionsCount(userId) {
	const sqlQuery = `
		SELECT COUNT(*) AS num_interactions
		FROM user_paper_interactions
		WHERE user_id = $1;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows[0];
}


// Insert a user's profile preferences
export async function upsertUserProfilePreferences(userId, profile) {
	const sqlQuery = `
		INSERT INTO user_profile_preferences (
			user_id, topic_preferences, domain_preferences, field_preferences, subfield_preferences,
			author_preferences, keyword_preferences, updated_at
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
		ON CONFLICT (user_id) DO UPDATE SET
			topic_preferences = EXCLUDED.topic_preferences,
			domain_preferences = EXCLUDED.domain_preferences,
			field_preferences = EXCLUDED.field_preferences,
			subfield_preferences = EXCLUDED.subfield_preferences,
			author_preferences = EXCLUDED.author_preferences,
			keyword_preferences = EXCLUDED.keyword_preferences,
			updated_at = CURRENT_TIMESTAMP
		RETURNING *;
	`;

	const profileValues = [
		userId,
		profile.topicPreferences ?? {},
		profile.domainPreferences ?? {},
		profile.fieldPreferences ?? {},
		profile.subfieldPreferences ?? {},
		profile.authorPreferences ?? {},
		profile.keywordPreferences ?? {},
	];
	
	const result = await pool.query(sqlQuery, profileValues);
	return result.rows[0];
}

// Fetch a user's profile preferences
export async function fetchUserProfilePreferences(userId) {
	const sqlQuery = `
		SELECT
			user_id, 
			topic_preferences, 
			domain_preferences, 
			field_preferences,
			subfield_preferences, 
			author_preferences, 
			keyword_preferences, 
			updated_at
		FROM user_profile_preferences
		WHERE user_id = $1;
	`;

	const result = await pool.query(sqlQuery, [userId]);
	return result.rows[0] ?? null;
}

// Fetch all user profile preferences
export async function fetchAllUserProfilePreferences() {
	const sqlQuery = `
		SELECT *
		FROM user_profile_preferences
		ORDER BY updated_at DESC;
	`;

	const results = await pool.query(sqlQuery);
	return results.rows;
}

// Deletes a user profile preference
export async function deleteUserProfilePreferences(userId) {
	const sqlQuery = `
		DELETE FROM user_profile_preferences
		WHERE user_id = $1;
	`;

	const result = await pool.query(sqlQuery, [userId]);
	return result.rowCount;
}