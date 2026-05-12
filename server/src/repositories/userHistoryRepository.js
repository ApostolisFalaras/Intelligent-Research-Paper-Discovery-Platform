import pool from "./../config/db.js";

// Fetch user search history based on user id
export async function fetchUserSearchHistory(id, pagination) {
    const sqlQuery = `
        SELECT *
        FROM user_search_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3;
    `;

    const result = await pool.query(sqlQuery, [id, pagination.limit, pagination.offset]);
    return result.rows;
}