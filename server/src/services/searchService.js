import { searchPapersByTextQuery } from "./../repositories/searchRepository.js";

export async function searchPapers(query) {
    const papers = await searchPapersByTextQuery(query.trim());

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
