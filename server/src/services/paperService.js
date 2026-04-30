import { fetchPaperById } from "./../repositories/paperRepository.js";
import { formatPage } from "./../utils/formatPages.js";

// Fetch a paper with a particular "id" 
export async function getPaperById(id) {
    const paper = await fetchPaperById(id);
    
    // If paper doesn't exist, controller will return 404 error
    if (!paper)
        return null;

    // Paper Data Transfer Object (DTO)
    // Grouping paper fields into logical units so that the client can display them appropriately
    const paperDTO = {
        id: paper.openalex_id,
        internalId: paper.id,
        doi: paper.doi,

        title: paper.title,
        displayName: paper.display_name,
        abstract: paper.abstract,

        publication: {
            year: paper.publication_year,
            date: paper.publication_date.toISOString().slice(0,10), // Extract YYYY-MM-DD from Date object
            type: paper.paper_type,
            language: paper.language,
        },

        source: {
            id: paper.primary_source_openalex_id,
            name: paper.primary_source_display_name,
            type: paper.primary_source_type,
            volume: paper.biblio_volume,
            issue: paper.biblio_issue,
            pages: formatPage(paper.biblio_first_page, paper.biblio_last_page), // Create "firstPage-lastPage"
        },

        topic: {
            id: paper.primary_topic_openalex_id,
            name: paper.primary_topic_display_name,
            domain: paper.primary_domain_display_name,
            field: paper.primary_field_display_name,
            subfield: paper.primary_subfield_display_name,
        },

        metrics: {
            citedByCount: paper.cited_by_count,
            fwci: Number(paper.fwci), // String inside the database
            citationPercentile: Number(paper.citation_normalized_percentile_value), // String inside the database
            top1Percent: paper.citation_top_1_percent,
            top10Percent: paper.citation_top_10_percent,
            referencedWorksCount: paper.referenced_works_count,
        },

        access: {
            isOpenAccess: paper.is_open_access,
            status: paper.open_access_status,
            bestURL: paper.open_access_best_url,
            anyRepoHasFullText: paper.open_access_any_repo_has_fulltext,
            hasFullText: paper.has_fulltext,
            hasPDF: paper.has_content_pdf,
            hasGrobIdXML: paper.has_content_grobid_xml,
        },

        indexedIn: paper.indexed_in ?? [],

        flags: {
            isRetracted: paper.is_retracted,
            isParatext: paper.is_paratext,
        },
        
        metadata: {
            openalexCreatedAt: paper.openalex_created_at,
            openalexUpdatedAt: paper.openalex_updated_at
        },
    };

    return paperDTO;
}

// Fetch recommendations based on a paper with a particular id
export async function getPaperRecommendations(id) {}
