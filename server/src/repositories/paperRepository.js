import pool from "./../config/db.js";

// Searches a paper with a particular "id" in the database
export async function fetchPaperById(id) {
    const sqlQuery = `
        SELECT * 
        FROM papers 
        WHERE openalex_id = $1
        LIMIT 1;
    `;

    try {
        const result = await pool.query(sqlQuery, [id]);
        return result.rows[0] || null;
    } 
    catch (error) {
        console.error("Database Error:", error);
        throw new Error("Database query failed."); // DB error, the controller throws a 500 error
    }
}