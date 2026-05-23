import pool from "./../config/db.js";

// Fetch a user's project folders based on their id
export async function fetchProjectFoldersById(id) {
    const sqlQuery = `
        SELECT *
        FROM user_folders
        WHERE user_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;   
}

// Create a new project folder 
export async function createProjectFolder(id, folderData) {
    const sqlQuery = `
        INSERT INTO user_folders (user_id, name, summary, is_pinned, visibility, color, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

    const values = [
        id,
        folderData.name,
        folderData.summary,
        folderData.isPinned,
        folderData.visibility,
        folderData.color,
        folderData.icon
    ];

    const result = await pool.query(sqlQuery, values);
    return result.rowCount;
}