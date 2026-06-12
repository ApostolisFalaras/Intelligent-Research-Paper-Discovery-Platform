import pool from "./../config/db.js";

// User fetches a topic by id
export async function fetchTopicById(id) {
	const sqlQuery = `
		SELECT *
		FROM topics
		WHERE openalex_id = $1;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows[0] || null;
}

// Fetches the top papers assocuated witha topic
// based on pagination filters
export async function fetchTopicPapers(id, limit, offset) {
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

			FROM papers p
			
			JOIN paper_topics pt
			ON pt.paper_id = p.id

			LEFT JOIN paper_authors pa
			ON pa.paper_id = p.id

			WHERE pt.topic_id = $1

			GROUP BY p.id

			ORDER BY p.cited_by_count DESC NULLS LAST

			LIMIT $2
			OFFSET $3;
	`;

	const results = await pool.query(sqlQuery, [id, limit, offset]);
	return results.rows;
} 