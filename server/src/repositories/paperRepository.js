import pool from "./../config/db.js";

// Fetches a paper with a particular "id" in the database
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

// Fetches a paper's associated authors
export async function fetchPaperAuthorsById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_authors
        WHERE paper_id = $1
        ORDER BY author_order ASC;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the institutions associated with a paper's authors
export async function fetchPaperAuthorInstitutionsById(id) {
    const sqlQuery = `
        SELECT pai.*
        FROM paper_author_institutions pai
        JOIN paper_authors pa
        ON pai.paper_author_id = pa.id
        WHERE pa.paper_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the affiliations associated with a paper's authors
export async function fetchPaperAuthorAffiliationsById(id) {
    const sqlQuery = `
        SELECT paf.*
        FROM paper_author_affiliations paf
        JOIN paper_authors pa
        ON paf.paper_author_id = pa.id 
        WHERE pa.paper_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the a paper's associated topics
export async function fetchPaperTopicsById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_topics
        WHERE paper_id = $1
        ORDER BY is_primary_topic DESC, score DESC NULLS LAST;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the a paper's associated keywords
export async function fetchPaperKeywordsById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_keywords
        WHERE paper_id = $1
        ORDER BY score DESC NULLS LAST;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the a paper's associated locations
export async function fetchPaperLocationsById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_locations
        WHERE paper_id = $1
        ORDER BY is_best_oa DESC, is_primary DESC;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the a paper's associated references
export async function fetchPaperReferencesById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_references
        WHERE paper_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the a paper's associated related
export async function fetchPaperRelatedById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_related
        WHERE paper_id = $1;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}

// Fetches the a paper's associated counts by year
export async function fetchPaperCountsByYearById(id) {
    const sqlQuery = `
        SELECT *
        FROM paper_counts_by_year
        WHERE paper_id = $1
        ORDER BY year DESC;
    `;

    const result = await pool.query(sqlQuery, [id]);
    return result.rows;
}
