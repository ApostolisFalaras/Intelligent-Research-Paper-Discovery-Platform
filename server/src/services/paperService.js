import {
    fetchPaperById,
    fetchPaperAuthorsById,
    fetchPaperAuthorInstitutionsById,
    fetchPaperAuthorAffiliationsById,
    fetchPaperTopicsById,
    fetchPaperKeywordsById,
    fetchPaperLocationsById,
    fetchPaperReferencesById,
    fetchPaperRelatedById,
    fetchPaperCountsByYearById } from "./../repositories/paperRepository.js";

import { fetchPaperIsSaved, fetchPaperSavedFolders } from "./../repositories/userFolderRepository.js";
import { formatPage } from "./../utils/formatPages.js";
import { AppError } from "./../utils/AppError.js";
import { parseString, parseInteger, parseUserId } from "./../utils/parseData.js";

// Fetch a paper with a particular "id" 
export async function getPaperById(id) {

    // Validate paper id
    const parsedId = parseString(id, "paper id");

    // Validate paper id format: "W" followed by digits
    if (!parsedId || !/^W\d+$/.test(parsedId)) {
        throw new AppError("Invalid paper Id", 400);
    }

    const paper = await fetchPaperById(id);
    
    // Validate if the paper exists
    if (!paper)
        throw new AppError("Paper not found", 404);

    const [authors, institutions, affiliations, topics, keywords, locations, references, related, counts] = 
        await Promise.all([
            fetchPaperAuthorsById(paper.id),
            fetchPaperAuthorInstitutionsById(paper.id),
            fetchPaperAuthorAffiliationsById(paper.id),
            fetchPaperTopicsById(paper.id),
            fetchPaperKeywordsById(paper.id),
            fetchPaperLocationsById(paper.id),
            fetchPaperReferencesById(paper.id),
            fetchPaperRelatedById(paper.id),
            fetchPaperCountsByYearById(paper.id),
        ]);

    // Paper Data Transfer Object (DTO)
    // Grouping paper fields into logical units so that the client can display them appropriately
    return {
        id: paper.openalex_id,
        internalId: paper.id,
        doi: paper.doi,

        title: paper.title,
        displayName: paper.display_name,
        abstract: paper.abstract,

        publication: {
            year: paper.publication_year,
            date: paper.publication_date
                ? new Date(paper.publication_date).toISOString().slice(0, 10)
                : null, // Extract YYYY-MM-DD from Date object
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
            fwci: paper.fwci === null ? null : Number(paper.fwci), // String inside the database
            citationPercentile: paper.citation_normalized_percentile_value === null 
                ? null 
                : Number(paper.citation_normalized_percentile_value), // String inside the database
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

        authors: authors.map(author => ({
            id: author.author_openalex_id,
            authorExists: author.author_exists,
            orcid: author.author_orcid,
            displayName: author.author_display_name,
            rawAuthorName: author.raw_author_name,
            order: author.author_order,
            position: author.author_position,
            isCorresponding: author.is_corresponding,

            institutions: institutions
                .filter(inst => inst.paper_author_id === author.id)
                .map(inst => ({
                    id: inst.institution_openalex_id,
                    ror: inst.institution_ror,
                    displayName: inst.institution_display_name,
                    countryCode: inst.country_code,
                    type: inst.institution_type,
                    lineage: inst.lineage ?? []
                })),

            affiliations: affiliations
                .filter(aff => aff.paper_author_id === author.id)
                .map(aff => ({
                    internalId: aff.id,
                    rawString: aff.raw_affiliation_string,
                    institutionIds: aff.institution_ids ?? []
                }))
        })),

        
        topics: topics.map(topic => ({
            id: topic.topic_openalex_id,
            displayName: topic.topic_display_name,
            score: topic.score === null ? null : Number(topic.score),
            domain: {
                id: topic.domain_openalex_id,
                name: topic.domain_display_name
            },
            field: {
                id: topic.field_openalex_id,
                name: topic.field_display_name
            },
            subfield: {
                id: topic.subfield_openalex_id,
                name: topic.subfield_display_name
            },
            isPrimary: topic.is_primary_topic
        })),

        keywords: keywords.map(keyword => ({
            id: keyword.keyword_openalex_id,
            displayName: keyword.keyword_display_name,
            score: keyword.score === null ? null : Number(keyword.score)
        })),

        locations: locations.map(location => ({
            id: location.location_openalex_id,
            isOpenAccess: location.is_oa,
            landingPageUrl: location.landing_page_url,
            pdfUrl: location.pdf_url,

            source: {
                id: location.source_openalex_id,
                displayName: location.source_display_name,
                issnL: location.source_issn_l,
                issn: location.source_issn ?? [],
                isOpenAccess: location.source_is_oa,
                isInDOAJ: location.source_is_in_doaj,
                isCore: location.source_is_core,
                hostOrganization: location.source_host_organization,
                hostOrganizationName: location.source_host_organization_name,
                hostOrganizationLineage: location.source_host_organization_lineage ?? [],
                type: location.source_type
            },

            license: {
                name: location.license,
                id: location.license_id
            },

            version: location.version,
            isAccepted: location.is_accepted,
            isPublished: location.is_published,
            rawSourceName: location.raw_source_name,
            rawType: location.raw_type,
            isPrimary: location.is_primary,
            isBestOpenAccess: location.is_best_oa
        })),

        references: references.map(reference => ({
            id: reference.referenced_work_openalex_id,
        })),

        relatedPapers: related.map(related => ({
            id: related.related_work_openalex_id,
        })),

        countsByYear: counts.map(count => ({
            year: count.year,
            citedByCount: count.cited_by_count
        }))
    };
}

// Verifies whether a paper is saved in any folder
export async function paperIsSaved(userId, paperId) {
    const parsedUserId = parseUserId(userId);
    const parsedPaperId = parseInteger(paperId, "paper id");

    return await fetchPaperIsSaved(parsedUserId, parsedPaperId);
}

// Retrieves the folders a paper is saved in 
export async function getPaperSavedFolders(userId, paperId) {
    // Validate inputs 
    const parsedUserId = parseUserId(userId);
    const parsedPaperId = parseString(paperId, "paper Id");

    if (!/^W\d+$/.test(parsedPaperId)) {
        throw new AppError("Invalid paper id", 400);
    }

    // Retrieve paper's internal Id number
    const paper = await fetchPaperById(parsedPaperId);

    if (!paper) {
        throw new AppError("Paper not found", 404);
    }

    const folders = await fetchPaperSavedFolders(parsedUserId, paper.id);

    return folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        summary: folder.summary,
        color: folder.color,
        paperCount: folder.paper_count
    }));
}