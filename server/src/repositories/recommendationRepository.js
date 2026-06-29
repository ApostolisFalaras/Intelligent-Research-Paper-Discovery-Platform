import pool from "./../config/db.js";

// Fetch recommendations for a user who is not logged in, which are
// the most popular papers across the whole database
export async function fetchPopularRecommendations(limit = 5, offset = 0) {
	const sqlQuery = `
		SELECT
			p.id,
			p.openalex_id,
			COALESCE(p.title, p.display_name) AS title,
			p.abstract,
			p.publication_year,
			p.cited_by_count,
			p.fwci,
			p.primary_source_display_name,
			p.primary_topic_display_name,
			p.is_open_access,
			p.open_access_status,

			COUNT(pa.author_openalex_id) AS author_count,

			COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order
                ) FILTER (
                    WHERE pa.author_order <= 2 
                    AND pa.author_openalex_id IS NOT NULL
                ),
                '[]'::json
            ) AS authors_preview

			FROM paper_metrics pm

			JOIN papers p ON p.id = pm.paper_id

			LEFT JOIN paper_authors pa ON pa.paper_id = p.id

			GROUP BY p.id, pm.popularity_score

			ORDER BY pm.popularity_score DESC

			LIMIT $1
			OFFSET $2;
	`;

	const results = await pool.query(sqlQuery, [limit, offset]);
	return results.rows;
}

// Fetch the top content-based recommendations for a user,
// according to their previous interactions with other papers
export async function fetchContentRecommendations(userId, limit = 25, offset = 0) {
	const sqlQuery = `
		SELECT 
            p.id, 
            p.openalex_id, 
            COALESCE(p.title, p.display_name) AS title,
            p.display_name,
            p.abstract, 
            p.publication_year, 
            p.cited_by_count,
            p.fwci,
            p.primary_source_display_name,
            p.primary_topic_display_name,
            p.is_open_access,
            p.open_access_status,

            COUNT(pa.author_openalex_id) AS author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order
                ) FILTER (
                    WHERE pa.author_order <= 2 
                    AND pa.author_openalex_id IS NOT NULL
                ),
                '[]'::json
            ) AS authors_preview

        FROM user_recommendation_cache urc
        
        JOIN papers p ON p.id = urc.paper_id
        
        LEFT JOIN paper_authors pa ON pa.paper_id = p.id

        WHERE urc.user_id = $1

        GROUP BY p.id 

        ORDER BY urc.content_score DESC

		LIMIT $2
		OFFSET $3; 
	`;

	const results = await pool.query(sqlQuery, [userId, limit, offset]);
	return results.rows;
}

// Fetch the top user-based recommendations for a user,
// according to similar users' interactions
export async function fetchUserRecommendations(userId, limit = 25, offset = 0) {
	const sqlQuery = `
		SELECT 
            p.id, 
            p.openalex_id, 
            COALESCE(p.title, p.display_name) AS title,
            p.display_name,
            p.abstract, 
            p.publication_year, 
            p.cited_by_count,
            p.fwci,
            p.primary_source_display_name,
            p.primary_topic_display_name,
            p.is_open_access,
            p.open_access_status,

            COUNT(pa.author_openalex_id) AS author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order
                ) FILTER (
                    WHERE pa.author_order <= 2 
                    AND pa.author_openalex_id IS NOT NULL
                ),
                '[]'::json
            ) AS authors_preview

        FROM user_recommendation_cache urc
        
        JOIN papers p ON p.id = urc.paper_id
        
        LEFT JOIN paper_authors pa ON pa.paper_id = p.id

        WHERE urc.user_id = $1

        GROUP BY p.id 

        ORDER BY urc.collaborative_score DESC

		LIMIT $2
		OFFSET $3;
	`;

	const results = await pool.query(sqlQuery, [userId, limit, offset]);
	return results.rows;
}

// Fetch the top topic-based recommendations for a user,
// according to the topic preferences of the user
export async function fetchTopicRecommendations(userId, limit = 25, offset = 0) {
	const sqlQuery = `
		SELECT 
            p.id, 
            p.openalex_id, 
            COALESCE(p.title, p.display_name) AS title,
            p.display_name,
            p.abstract, 
            p.publication_year, 
            p.cited_by_count,
            p.fwci,
            p.primary_source_display_name,
            p.primary_topic_display_name,
            p.is_open_access,
            p.open_access_status,

            COUNT(pa.author_openalex_id) AS author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order
                ) FILTER (
                    WHERE pa.author_order <= 2 
                    AND pa.author_openalex_id IS NOT NULL
                ),
                '[]'::json
            ) AS authors_preview

        FROM user_recommendation_cache urc
        
        JOIN papers p ON p.id = urc.paper_id
        
        LEFT JOIN paper_authors pa ON pa.paper_id = p.id

        WHERE urc.user_id = $1

        GROUP BY p.id 

        ORDER BY urc.topic_score DESC

		LIMIT $2
		OFFSET $3; 
	`;

	const results = await pool.query(sqlQuery, [userId, limit, offset]);
	return results.rows;
}