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
export async function createProjectFolder(userId, folderData) {
    const sqlQuery = `
        INSERT INTO user_folders (user_id, name, summary, is_pinned, visibility, color, icon)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

    const values = [
        userId,
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

// Update a project folder
export async function updateProjectFolder(userId, folderId, updates) {
    const setClauseConditions = [];
    let index = 1;

    const values = [];

    if (updates.name !== undefined) { 
        setClauseConditions.push(`name = $${index}`); 
        values.push(updates.name);
        index += 1; 
    }

    if (updates.summary !== undefined) { 
        setClauseConditions.push(`summary = $${index}`); 
        values.push(updates.summary);
        index += 1; 
    }

    if (updates.visibility !== undefined) { 
        setClauseConditions.push(`visibility = $${index}`); 
        values.push(updates.visibility);
        index += 1; 
    }

    if (updates.color !== undefined) { 
        setClauseConditions.push(`color = $${index}`); 
        values.push(updates.color);
        index += 1; 
    }

    if (updates.icon !== undefined) { 
        setClauseConditions.push(`icon = $${index}`);
        values.push(updates.icon);
        index += 1; 
    }

    if (updates.isPinned !== undefined) { 
        setClauseConditions.push(`is_pinned = $${index}`);
        values.push(updates.isPinned); 
        index += 1; 
    }    

    if (setClauseConditions.length === 0) {
        throw new AppError("No valid fields provided for update", 400);
    }

    const setClause = setClauseConditions.join(", ");

    const sqlQuery = `
        UPDATE user_folders
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${index} AND id = $${index + 1};
    `;

    const result = await pool.query(sqlQuery, [...values, userId, folderId]);
    return result.rowCount;
}


// Delete a project folder
export async function deleteProjectFolder(userId, folderId) {
    const sqlQuery = `
        DELETE FROM user_folders
        WHERE user_id = $1 AND id = $2;
    `;

    const result = await pool.query(sqlQuery, [userId, folderId]);
    return result.rowCount;
}

// Fetches the papers of a particular project folder
export async function fetchPapersFromFolderById(userId, folderId) {
    const sqlQuery = `
        SELECT *
        FROM user_folder_papers
        WHERE user_id = $1 AND folder_id = $2;
    `;

    const result = await pool.query(sqlQuery, [userId, folderId]);
    return result.rows;
}