import { 
	fetchAuthorById,
	fetchAuthorAffiliationsById,
	fetchAuthorLastKnownInstitutionsById,
	fetchAuthorTopicsById,
	fetchAuthorTopicSharesById,
	fetchAuthorCountsByYearById } from "./../repositories/authorRepository.js";
import { AppError } from "./../utils/AppError.js";
import { parseString } from "./../utils/parseData.js";


// Fetch author with a particular id from the DB
export async function getAuthorById(id) {
	// Validate paper id
	const parsedId = parseString(id, "author id");

	// Validate paper id format: "W" followed by digits
	if (!parsedId || !/^A\d+$/.test(parsedId)) {
		throw new AppError("Invalid author Id", 400);
	}
	
	const author = await fetchAuthorById(parsedId);

	// Validate if author exists
	if (!author)
		throw new AppError("Author not found", 404);

	const [affiliations, lastKnownInstitutions, topics, topicShares, counts] =
		await Promise.all([
			fetchAuthorAffiliationsById(author.id),
			fetchAuthorLastKnownInstitutionsById(author.id),
			fetchAuthorTopicsById(author.id),
			fetchAuthorTopicSharesById(author.id),
			fetchAuthorCountsByYearById(author.id)
		]);

	// Author Data Transfer Object (DTO)
    // Grouping author fields into logical units so that the client can display them appropriately
	return {
		id: author.openalex_id,
		internalId: author.id,
		orcid: author.orcid,

		displayName: author.display_name,
		rawAuthorNames: author.raw_author_names ?? [],
		fullName: author.full_name,

		worksCount: author.works_count,
		citedByCount: author.cited_by_count,
		twoYearMeanCitedness: author.two_year_mean_citedness === null
			? null
			: Number(author.two_year_mean_citedness),
		hIndex: author.h_index,
		i10Index: author.i10_index,

		worksApiURL: author.works_api_url,
		createdAt: author.openalex_created_at,
		updatedAt: author.openalex_updated_at,

		affiliations: affiliations.map(aff => ({
			id: aff.institution_openalex_id,
			institutionRor: aff.institution_ror,
			displayName: aff.institution_display_name,
			countryCode: aff.institution_country_code,
			institutionType: aff.institution_type,
			lineage: aff.lineage,
			years: aff.years
		})),

		lastKnownInstitutions: lastKnownInstitutions.map(inst => ({
			id: inst.institution_openalex_id,
			institutionRor: inst.institution_ror,
			displayName: inst.institution_display_name,
			countryCode: inst.institution_country_code,
			institutionType: inst.institution_type,
			lineage: inst.institution_lineage,
		})),

		topics: topics.map(topic => ({
			id: topic.topic_openalex_id,
			displayName: topic.topic_display_name,
			worksCount: topic.works_count,
			domainId: topic.domain_openalex_id,
			domain: topic.domain_display_name,
			fieldId: topic.field_openalex_id,
			field: topic.field_display_name,
			subfieldId: topic.subfield_openalex_id,
			subfield: topic.subfield_display_name
		})),

		topicShares: topicShares.map(share => ({
			id: share.topic_openalex_id,
			displayName: share.topic_display_name,
			value: share.value === null ? null : Number(share.value),
			domainId: share.domain_openalex_id,
			domain: share.domain_display_name,
			fieldId: share.field_openalex_id,
			field: share.field_display_name,
			subfieldId: share.subfield_openalex_id,
			subfield: share.subfield_display_name
		})),

		countsByYear: counts.map(count => ({
			year: count.year,
    		worksCount: count.works_count,
    		oaWorksCount: count.oa_works_count,
    		citedByCount: count.cited_by_count
		}))
	};
}