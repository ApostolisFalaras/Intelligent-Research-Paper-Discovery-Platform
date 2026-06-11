import pool from "./../config/db.js";

// Fetches author by id
export async function fetchAuthorById(id) {
	const sqlQuery = `
		SELECT *
		FROM authors
		WHERE openalex_id = $1
		LIMIT 1;
	`;

	const result = await pool.query(sqlQuery, [id]);
	return result.rows[0] || null;
}

// Fetches the affiliations associated with an author
export async function fetchAuthorAffiliationsById(id) {
	const sqlQuery = `
		SELECT *
		FROM author_affiliations
		WHERE author_id = $1
		ORDER BY institution_display_name ASC;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows;
}

// Fetches an author's last known affiliations
export async function fetchAuthorLastKnownInstitutionsById(id) {
	const sqlQuery = `
		SELECT *
		FROM author_last_known_institutions
		WHERE author_id = $1
		ORDER BY institution_display_name ASC;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows;
}

// Fetches an author's associated topics
export async function fetchAuthorTopicsById(id) {
	const sqlQuery = `
		SELECT *
		FROM author_topics
		WHERE author_id = $1
		ORDER BY works_count DESC NULLS LAST;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows;
}

// Fetches an author's associated topic shares
export async function fetchAuthorTopicSharesById(id) {
	const sqlQuery = `
		SELECT *
		FROM author_topic_share
		WHERE author_id = $1
		ORDER BY value DESC NULLS LAST;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows;
}

// Fetches an author's associated citation counts by year
export async function fetchAuthorCountsByYearById(id) {
	const sqlQuery = `
		SELECT *
		FROM author_counts_by_year
		WHERE author_id = $1
		ORDER BY year DESC;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows;
}

// Fetches the top 5 most cited paper (as paper cards) associated with an author
export async function fetchAuthorPapers(id, limit, offset) {
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

			COUNT(pa_all.author_openalex_id) as author_count,

			COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa_all.author_openalex_id,
                        'name', pa_all.author_display_name
                    )
                    ORDER BY pa_all.author_order 
                ) FILTER (
                    WHERE pa_all.author_order <= 2 AND pa_all.author_openalex_id IS NOT NULL 
                ), 
                '[]'::json
            ) AS authors_preview

			FROM papers p
			
			JOIN paper_authors pa_target
			ON pa_target.paper_id = p.id

			LEFT JOIN paper_authors pa_all
			ON pa_all.paper_id = p.id

			WHERE pa_target.author_id = $1

			GROUP BY p.id

			ORDER BY p.cited_by_count DESC NULLS LAST

			LIMIT $2
			OFFSET $3;
	`;

	const results = await pool.query(sqlQuery, [id, limit, offset]);
	return results.rows;
} 