import pool from "./../config/db.js";

export async function fetchProjectFoldersById(id) {
    const sqlQuery = `
        SELECT *
        FROM user_folders
        WHERE user_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;   
}