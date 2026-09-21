import pool from "./../config/db.js";


// Fetches a set of randomly selected topics
export async function fetchRandomTopics(limit = 10) {
	const sqlQuery = `
		SELECT 
			id,
			openalex_id,
			topic_display_name,
			field_display_name,
			topic_description,
			works_count,
			cited_by_count
		FROM topics
		ORDER BY RANDOM()
		LIMIT $1;
	`;

	const result = await pool.query(sqlQuery, [limit]);
	return result.rows;
}

// Fetches a randomly selected set of papers as a preview of a particular topic
export async function fetchRandomPapersByTopic(topicId, limit = 10) {
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
        
		FROM paper_topics pt

        JOIN papers p
		  ON p.id = pt.paper_id

        LEFT JOIN paper_authors pa 
		  ON pa.paper_id = p.id

		WHERE pt.topic_openalex_id = $1
		GROUP BY p.id

		ORDER BY RANDOM()
		LIMIT $2;
	`;

	const result = await pool.query(sqlQuery, [topicId, limit]);
	return result.rows;
}


// Fetches a topic's name for display at the explore page
export async function fetchExploreTopicById(topicId) {
	const sqlQuery = `
		SELECT 
			openalex_id, 
			topic_display_name,
			field_display_name
		FROM topics
		WHERE openalex_id = $1;
	`;

	const result = await pool.query(sqlQuery, [topicId]);
	return result.rows[0];
}


// Fetches paginated sets of papers that belong in a specific topic
export async function fetchExplorePapersByTopic(topicId, limit, offset, sort = "citations") {
	let orderByClause;

	switch(sort) {
		case "recent": 
			orderByClause = `
				p.publication_year DESC NULLS LAST,
				p.id DESC
			`;
			break;

		case "citations":
			orderByClause = `
				p.cited_by_count DESC,
				p.id DESC
			`;
			break;

		case "popular":
		default:
			orderByClause = `
				COALESCE(pm.popularity_score, 0) DESC,
				p.id DESC	
			`;
			break;
	}

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

		FROM paper_topics pt

		JOIN papers p
		  ON p.id = pt.paper_id

		LEFT JOIN paper_authors pa
		  ON pa.paper_id = p.id

		LEFT JOIN paper_metrics pm
		  ON pm.paper_id = p.id

		WHERE pt.topic_openalex_id = $1
		GROUP BY p.id, pm.popularity_score

		ORDER BY ${orderByClause}

		LIMIT $2
		OFFSET $3;
	`;

	const result = await pool.query(sqlQuery, [topicId, limit, offset]);
	return result.rows;
}

// Fetches the total number of papers that belong in a particular topic
export async function fetchExploreTopicPaperCount(topicId) {
	const sqlQuery = `
		SELECT COUNT(DISTINCT pt.paper_id) AS total_results
		FROM paper_topics pt
		WHERE pt.topic_openalex_id = $1;
	`;

	const result = await pool.query(sqlQuery, [topicId]);
	return Number(result.rows[0].total_results);
}