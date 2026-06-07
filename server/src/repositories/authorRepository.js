import pool from "./../config/db.js";

// Fetches author by id
export async function fetchAuthorById(id) {
	const sqlQuery = `
		SELECT *
		FROM authors
		WHERE openalex_id = $1;
	`;

	const result = await pool.query(sqlQuery, [id]);
	return result.rows[0];
}

// Fetches the affiliations associated with an author
export async function fetchAuthorAffiliationsById(id) {
	const sqlQuery = `
		SELECT *
		FROM author_affiliations
		WHERE author_id = $1
		ORDER BY institution_display_name ASC;;
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
		ORDER BY institution_display_name ASC;;
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
		ORDER BY works_count DESC NULLS LAST;;
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
		ORDER BY value DESC NULLS LAST;;
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
		ORDER BY year DESC;;
	`;

	const results = await pool.query(sqlQuery, [id]);
	return results.rows;
}