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