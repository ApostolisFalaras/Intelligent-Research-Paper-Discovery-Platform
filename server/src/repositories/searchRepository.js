import pool from "./../config/db.js";

export async function searchPapersByTextQuery(filters) {
    const filterValues = [filters.query];

    // Construct query WHERE & ORDER BY clauses
    const whereClause = buildWHEREClause(filters, filterValues).join(" AND ");
    const orderByClause = buildORDERBYClause(filters);

    let totalResults = null;

    if (filters.includeCount) {
        const helperQuery = `
            SELECT COUNT(DISTINCT p.id) AS total_results
            FROM papers p
            LEFT JOIN paper_authors pa
                ON pa.paper_id = p.id
            WHERE ${whereClause};
        `;

        const helperResult = await pool.query(helperQuery, [...filterValues]);

        totalResults = Number(helperResult.rows[0].total_results);
    }

    const searchValues = [...filterValues, filters.limit, filters.offset];
    const limitIndex = filterValues.length + 1; // value for the query '$' parameters
    const offsetIndex = filterValues.length + 2; // value for the query '$' parameters

    // Query to extract the minimum info needed to present the result paper cards.
    // Also performs a left join with "paper_authors" in order to mention a few of the authors in the paper card.
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
            ts_rank(
                p.search_vector,
                websearch_to_tsquery('english', $1)
            ) AS rank,

            COUNT(pa.author_openalex_id) as author_count,

            COALESCE(
                json_agg(
                    json_build_object(
                        'id', pa.author_openalex_id,
                        'name', pa.author_display_name
                    )
                    ORDER BY pa.author_order 
                ) FILTER (
                    WHERE pa.author_order <= 2 AND pa.author_openalex_id IS NOT NULL 
                ), 
                '[]'::json
            ) AS authors_preview
        
        FROM papers p
        LEFT JOIN paper_authors pa ON pa.paper_id = p.id

        WHERE ${whereClause}
        GROUP BY p.id
        ${orderByClause}
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex};
    `;

    // Any potential DB errors propagate to the controller, 
    // and are handled by the global error-handling middleware
    const result = await pool.query(sqlQuery, searchValues);

    return {
        papers: result.rows,
        totalResults
    }
}


// Build a dynamic WHERE clause based on the arbitrary user selection of filters
function buildWHEREClause(filters, values) {
    const whereClause = ["p.search_vector @@ websearch_to_tsquery('english', $1)"];

    // For each of the following filters, if one doesn't exist (null), it's skipped
    // Otherwise, the filter portion of the WHERE clause is appended in the list

    if (filters.fromYear !== null) {
        values.push(filters.fromYear);
        whereClause.push(`p.publication_year >= $${values.length}`);
    }

    if (filters.toYear !== null) {
        values.push(filters.toYear);
        whereClause.push(`p.publication_year <= $${values.length}`);
    }

    if (filters.language !== null) {
        values.push(filters.language);
        whereClause.push(`p.language_text = $${values.length}`);
    }

    if (filters.paperType !== null) {
        values.push(filters.paperType);
        whereClause.push(`p.paper_type = $${values.length}`);
    }

    if (filters.minCitations !== null) {
        values.push(filters.minCitations);
        whereClause.push(`p.cited_by_count >= $${values.length}`);
    }

    if (filters.topicId !== null) {
        values.push(filters.topicId);
        whereClause.push(`p.primary_topic_openalex_id = $${values.length}`);
    }

    if (filters.authorName !== null) {
        values.push(filters.authorName);
        whereClause.push(`pa.author_display_name = $${values.length}`);
    }

    // Don't check, since isOpenAccess is true by default
    values.push(filters.isOpenAccess);
    whereClause.push(`p.is_open_access = $${values.length}`);

    if (filters.hasContentPDF !== null) {
        values.push(filters.hasContentPDF);
        whereClause.push(`p.has_content_pdf = $${values.length}`);
    }

    // Don't check, since isOpenAccess is false by default
    values.push(filters.isRetracted);
    whereClause.push(`p.is_retracted = $${values.length}`);

    return whereClause;
}

// Build the ORDER BY clause based on the primary sort filter
function buildORDERBYClause(filters) {

    // For each case provide secondary sorting filters
    switch (filters.sort) {
        case "citations":
            return `ORDER BY p.cited_by_count DESC NULLS LAST, rank DESC NULLS LAST`;
        case "impact":
            return `ORDER BY p.fwci DESC NULLS LAST, p.cited_by_count DESC NULLS LAST, rank DESC NULLS LAST`;
        case "year":
            return `ORDER BY p.publication_year DESC NULLS LAST, rank DESC NULLS LAST`;
        case "relevance":
        case "default":
            return `ORDER BY rank DESC NULLS LAST, p.cited_by_count DESC NULLS LAST`;
    }
}