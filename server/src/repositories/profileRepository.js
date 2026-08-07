import pool from "../config/db.js";

// Fetches the number of viewed papers for a particular user
export async function fetchUserTotalViewedPapers(userId) {
	const sqlQuery = `
		SELECT COALESCE(SUM(view_count), 0)::integer AS total_viewed_papers
		FROM user_paper_interactions
		WHERE user_id = $1
		  AND view_count > 0;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows[0];
}

// Fetches a preview of recent activity, specifically the 4 most recent paper viewed
export async function fetchUserRecentlyViewedPapers(userId) {
	const sqlQuery = `
		SELECT
			p.openalex_id,
			upi.paper_id,
			COALESCE(p.title, p.display_name) AS title,
			p.primary_topic_display_name,
			COUNT(pa.author_openalex_id) as author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order 
                ) FILTER (
                    WHERE pa.author_order <= 2 AND pa.author_openalex_id IS NOT NULL 
                ), 
                '[]'::json
            ) AS authors_preview

		FROM user_paper_interactions upi
		JOIN papers p
		  ON upi.paper_id = p.id
		JOIN paper_authors pa
		  ON p.id = pa.paper_id

		WHERE upi.user_id = $1
		  AND upi.view_count > 0

		GROUP BY
            upi.paper_id,
            p.openalex_id,
            p.title,
            p.display_name,
            p.primary_topic_display_name,
            upi.last_interaction_at
		  
		ORDER BY upi.last_interaction_at DESC, upi.paper_id ASC
		LIMIT 4;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows;
}


// Fetches the number of saved papers for a particular user
export async function fetchUserTotalSavedPapers(userId) {
	const sqlQuery = `
		SELECT COUNT(*) AS total_saved_papers
		FROM user_paper_interactions
		WHERE user_id = $1
		  AND is_saved = true;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows[0];
}

// Fetches a preview of recent saved papers, specifically the 4 most recent paper viewed
export async function fetchUserRecentlySavedPapers(userId) {
	const sqlQuery = `
		SELECT 
			p.openalex_id,
			upi.paper_id,
			COALESCE(p.title, p.display_name) AS title,
			p.primary_topic_display_name,
			COUNT(pa.author_openalex_id) as author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order 
                ) FILTER (
                    WHERE pa.author_order <= 2 AND pa.author_openalex_id IS NOT NULL 
                ), 
                '[]'::json
            ) AS authors_preview

		FROM user_paper_interactions upi
		JOIN papers p
		  ON upi.paper_id = p.id
		JOIN paper_authors pa
		  ON p.id = pa.paper_id

		WHERE upi.user_id = $1
		  AND upi.is_saved = true

		GROUP BY
            upi.paper_id,
            p.openalex_id,
            p.title,
            p.display_name,
            p.primary_topic_display_name,
            upi.last_interaction_at
		  
		ORDER BY upi.last_interaction_at DESC, upi.paper_id ASC
		LIMIT 4;
	`;

	const results = await pool.query(sqlQuery, [userId]);
	return results.rows;
}

// Fetches the number of folders for a particular user
export async function fetchUserTotalFolders(id) {
    const sqlQuery = `
        SELECT COUNT(*) AS total_user_folders
        FROM user_folders
        WHERE user_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows[0];   
}

// Fetches a preview of the users folder names, specifically the 3 most populated folders
export async function fetchUserFoldersPreview(id) {
    const sqlQuery = `
        SELECT id, name, paper_count, color
        FROM user_folders
        WHERE user_id = $1
		ORDER BY paper_count DESC, updated_at DESC, id ASC
		LIMIT 3;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;   
}

// Fetches a preview of the followed author names, specifically the 3 most recent follows
export async function fetchUserFollowedAuthors(id) {
	const sqlQuery = `
		SELECT DISTINCT ufa.author_id, pa.author_display_name AS author_name, ufa.created_at
		FROM user_follows_authors ufa
		JOIN paper_authors pa 
		  ON ufa.author_id = pa.author_id 
		WHERE ufa.user_id = $1
		ORDER BY ufa.created_at DESC, ufa.author_id ASC;
	`;

	const result = await pool.query(sqlQuery, [id]);
	return result.rows;
}

// Fetches the top 10 research topics for the current user profile
export async function fetchUserTopResearchTopics(id, limit = 8) {
	const sqlQuery = `
		SELECT
            t.openalex_id AS id,
            t.topic_display_name AS name,
            pref.score
        FROM user_profile_preferences upp

        CROSS JOIN LATERAL (
            SELECT
                key AS topic_id,
                value::double precision AS score
            FROM jsonb_each_text(upp.topic_preferences)
        ) pref

        JOIN topics t
            ON t.openalex_id = pref.topic_id

        WHERE upp.user_id = $1
        ORDER BY pref.score DESC
        LIMIT $2;
	`;

	const results = await pool.query(sqlQuery, [id, limit]);
	return results.rows;
}