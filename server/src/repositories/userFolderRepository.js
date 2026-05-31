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
        SELECT 
            p.id, 
            p.openalex_id, 
            COALESCE(p.title, p.display_name) AS title,
            p.display_name,
            p.abstract, 
            p.publication_year, 
            p.cited_by_count,
            p.fwci,
            p.primary_source_display_name,
            p.primary_topic_display_name,
            p.is_open_access,
            p.open_access_status,
            ufp.folder_id,
            ufp.added_at,

            COUNT(pa.author_openalex_id) AS author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order
                ) FILTER (
                    WHERE pa.author_order <= 2 
                    AND pa.author_openalex_id IS NOT NULL
                ),
                '[]'::json
            ) AS authors_preview

        FROM user_folder_papers ufp
        
        JOIN user_folders uf ON uf.id = ufp.folder_id
        
        JOIN papers p ON p.id = ufp.paper_id
        
        LEFT JOIN paper_authors pa ON pa.paper_id = p.id

        WHERE uf.user_id = $1 AND uf.id = $2

        GROUP BY p.id, ufp.folder_id, ufp.added_at

        ORDER BY ufp.added_at DESC;
`;

    const result = await pool.query(sqlQuery, [userId, folderId]);
    return result.rows;
}

// Helper function that checks for duplicate paper entries in a project folder
export async function fetchPaperInFolder(folderId, paperId) {
    const sqlQuery = `
        SELECT *
        FROM user_folder_papers
        WHERE folder_id = $1 AND paper_id = $2;
    `;

    const result = await pool.query(sqlQuery, [folderId, paperId]);
    return result;
}

// User inserts a paper to a project folder
export async function insertPapertoFolder(userId, folderId, paperId) {
    const sqlQuery = `
        INSERT INTO user_folder_papers (folder_id, paper_id)
            SELECT uf.id, p.id

            FROM user_folders uf
            JOIN papers p ON p.openalex_id = $3

            WHERE uf.user_id = $1 AND uf.id = $2
            ON CONFLICT (folder_id, paper_id) DO NOTHING;
    `;

    const result = await pool.query(sqlQuery, [userId, folderId, paperId]);
    return result.rowCount;
}
