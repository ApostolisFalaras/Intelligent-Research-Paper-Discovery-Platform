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

// Add record to user search history
export async function addToSearchHistory(userId, query, filters, resultCount) {
    // Returning the IDs to verify in the unit tests
    const sqlQuery = `
        INSERT INTO user_search_history (user_id, query, filters, result_count)
        VALUES ($1, $2, $3, $4)
        RETURNING id, user_id;
    `;

    // filters filed is of type JSONB, requires filters to be stringifyied
    const result = await pool.query(sqlQuery, [userId, query, JSON.stringify(filters), resultCount]);
    return result.rows[0];
}

// Deletes record from user search history
export async function deleteFromSearchHistory(userId, id) {
    const sqlQuery = `
        DELETE FROM user_search_history
        WHERE user_id = $1 AND id = $2;
    `;

    const result = await pool.query(sqlQuery, [userId, id]);
    return result.rowCount;
}