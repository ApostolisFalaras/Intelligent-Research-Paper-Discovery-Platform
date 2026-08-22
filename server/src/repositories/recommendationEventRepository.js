import pool from "./../config/db.js";

// User-Paper Interactions

// User views a paper -> update their individual paper interactions 
export async function upsertPaperView(userId, paperId) {
    const sqlQuery = `
        INSERT INTO user_paper_interactions (
            user_id, paper_id, view_count, is_saved, first_viewed_at, last_interaction_at
        )
        VALUES ($1, $2, 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        
		ON CONFLICT (user_id, paper_id)
        DO UPDATE SET
            view_count = user_paper_interactions.view_count + 1,
            last_interaction_at = CURRENT_TIMESTAMP

        WHERE user_paper_interactions.last_interaction_at
              < CURRENT_TIMESTAMP - INTERVAL '1 second'

        RETURNING paper_id;
    `;

    const result = await pool.query(sqlQuery, [userId, paperId]);

    return result.rowCount > 0;
}

// User saves a paper to a folder -> update their individual paper interactions
export async function upsertPaperSave(userId, paperId) {
    const sqlQuery = `
        UPDATE user_paper_interactions
        SET
            is_saved = true,
            last_interaction_at = CURRENT_TIMESTAMP
        
		WHERE user_id = $1
          AND paper_id = $2
          AND is_saved = false

        RETURNING paper_id;
    `;

    const result = await pool.query(sqlQuery, [userId, paperId]);

    return result.rowCount > 0;
}

// User un-saves a paper from a folder -> update their individual paper interactions
export async function upsertPaperUnsave(userId, paperId) {
	const sqlQuery = `
		UPDATE user_paper_interactions
		SET 
			is_saved = false,
			last_interaction_at = CURRENT_TIMESTAMP
		
		WHERE user_id = $1 
		  AND paper_id = $2
		  AND is_saved = true
		
		RETURNING paper_id;
	`;

	const result = await pool.query(sqlQuery, [userId, paperId]);

	return result.rowCount;
}


// Global Paper Interactions

// User view a paper -> Global paper view count incremented
export async function incrementPaperViewCount(paperId) {
	const sqlQuery = `
		INSERT INTO paper_metrics (
			paper_id, view_count, save_count, recommendation_click_count, popularity_score
		) 
		VALUES ($1, 1, 0, 0, 0)
		ON CONFLICT (paper_id) DO UPDATE SET
			view_count = paper_metrics.view_count + 1,
			updated_at = CURRENT_TIMESTAMP;
	`;

	await pool.query(sqlQuery, [paperId]);
}

// User saves a paper -> Global paper save count incremented
export async function incrementPaperSaveCount(paperId) {
	const sqlQuery = `
		INSERT INTO paper_metrics (
			paper_id, view_count, save_count, recommendation_click_count, popularity_score
		) 
		VALUES ($1, 0, 1, 0, 0)
		ON CONFLICT (paper_id) DO UPDATE SET
			save_count = paper_metrics.save_count + 1,
			updated_at = CURRENT_TIMESTAMP;
	`;

	await pool.query(sqlQuery, [paperId]);
}

// User un-saves a paper -> Global paper save count decremented
export async function decrementPaperSaveCount(paperId) {
	const sqlQuery = `
		UPDATE paper_metrics 
		SET save_count = GREATEST(save_count - 1, 0),
			updated_at = CURRENT_TIMESTAMP
		WHERE paper_id = $1;
	`;

	await pool.query(sqlQuery, [paperId]);
}

// User clicks a paper as a recommendation -> Global paper recomendation click count incremented
export async function incrementRecommendationClickCount(paperId) {
	const sqlQuery = `
		INSERT INTO paper_metrics (
			paper_id, view_count, save_count, recommendation_click_count, popularity_score
		) 
		VALUES ($1, 0, 0, 1, 0)
		ON CONFLICT (paper_id) DO UPDATE SET
			recommendation_click_count = paper_metrics.recommendation_click_count + 1,
			updated_at = CURRENT_TIMESTAMP;
	`;

	await pool.query(sqlQuery, [paperId]);
}
