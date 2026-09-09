import pool from "./../config/db.js";


// Fetches all topics and their openalex IDs
export async function fetchAllTopics() {
	const sqlQuery = `
		SELECT DISTINCT primary_topic_display_name, 
			primary_topic_openalex_id, 
			primary_field_display_name, 
			primary_field_openalex_id
		FROM papers
		WHERE primary_topic_openalex_id IS NOT NULL;
	`;
	
	const results = await pool.query(sqlQuery);
	return results.rows;
}