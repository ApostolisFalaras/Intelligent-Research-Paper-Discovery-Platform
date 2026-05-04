import pool from "./../config/db.js";

// Searches a paper with a particular "id" in the database
export async function fetchPaperById(id) {
    const sqlQuery = `
        SELECT * 
        FROM papers 
        WHERE openalex_id = $1
        LIMIT 1;
    `;

    // Any potential DB errors propagate to the controller, 
    // and are handled by the global error-handling middleware
    const result = await pool.query(sqlQuery, [id]);
    return result.rows[0] || null;
}