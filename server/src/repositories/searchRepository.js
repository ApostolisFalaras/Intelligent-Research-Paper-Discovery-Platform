import pool from "./../config/db.js";

export async function searchPapersByTextQuery(query) {
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

        WHERE p.search_vector @@ websearch_to_tsquery('english', $1)
        GROUP BY p.id
        ORDER BY rank DESC, p.cited_by_count DESC NULLS LAST
        LIMIT 25;
    `;

    try {
        const result = await pool.query(sqlQuery, [query]);
        return result.rows || null;
    } catch (error) {
        console.error("Database Error:", error);
        throw new Error("Database query failed."); // DB error, the controller throws a 500 error
    }
}