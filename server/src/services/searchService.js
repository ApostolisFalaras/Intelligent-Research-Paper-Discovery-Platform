import { searchPapersByTextQuery } from "./../repositories/searchRepository.js";
import { AppError } from "./../utils/AppError.js";

export async function searchPapers(query) {

     // Validate search bar's input query
    const { q } = query;

    if (!q || q.trim().length === 0) {
        throw new AppError("Search query is required", 400);
    }

    const papers = await searchPapersByTextQuery(q.trim());

    // Papers Data Transfer Object (DTO)
    const papersDTO = [];
    
    papers.map((paper) => {
        let paperDTO = {
            id: paper.openalex_id,
            internalId: paper.id,
            title: paper.title,
            displayName: paper.display_name,
            abstract: paper.abstract,
            publicationYear: paper.publication_year,
            citedByCount: paper.cited_by_count,
            primarySource: paper.primary_source_display_name,
            primaryTopic: paper.primary_topic_display_name,
            isOpenAccess: paper.is_open_access,
            openAccessStatus: paper.open_access_status,
            rank: Number(paper.rank),
            authorCount: Number(paper.author_count),
            authorsPreview: paper.authors_preview,
        };
        papersDTO.push(paperDTO);
    });

    return papersDTO;
}
