import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

// Mock the paper repository function that queries the PostgreSQL DB for a paper with a particular id
vi.mock("./../../src/repositories/authorRepository.js", () => ({ 
    fetchAuthorById: vi.fn(),
    fetchAuthorAffiliationsById: vi.fn(),
    fetchAuthorLastKnownInstitutionsById: vi.fn(),
    fetchAuthorTopicsById: vi.fn(),
    fetchAuthorTopicSharesById: vi.fn(),
    fetchAuthorCountsByYearById: vi.fn(),
}));

// Import after to replace the real function with the mock function
import { 
    fetchAuthorById,
    fetchAuthorAffiliationsById,
    fetchAuthorLastKnownInstitutionsById,
    fetchAuthorTopicsById,
    fetchAuthorTopicSharesById,
    fetchAuthorCountsByYearById, } from "../../src/repositories/authorRepository.js";
import app from "../../src/app.js";

const mockResolvedAuthor = {
    id: "50703",
    openalex_id: "A5107860229",
    orcid: null,
    display_name: "I. Badhrees",
    raw_author_names: [ "Badhrees, I.", "I Badhrees", "I. Badhrees" ],
    full_name: "Badhrees, I.",
    works_count: 190,
    cited_by_count: 5775,
    two_year_mean_citedness: 0,
    h_index: 34,
    i10_index: 99,
    works_api_url: "https://api.openalex.org/works?filter=author.id:A5107860229",
    openalex_created_at: new Date("2016-06-23T21:00:00.000Z").toISOString(),
    openalex_updated_at: new Date("2026-06-02T09:25:25.000Z").toISOString(),
};  

// Mocking 2/12 author affiliations for simplicity
const mockResolvedAuthorAffiliations = [
    {
        institution_openalex_id: "I4210161779",
        institution_ror: "https://ror.org/05stzyr92",
        institution_display_name: "Campbell Collaboration",
        institution_country_code: "NO",
        institution_type: "nonprofit",
        lineage: [ "https://openalex.org/I4210161779" ],
        years: [ 2018, 2016 ]
    },
    {
        institution_openalex_id: "I67031392",
        institution_ror: "https://ror.org/02qtvee93",
        institution_display_name: "Carleton University",
        institution_country_code: "CA",
        institution_type: "education",
        lineage: [ "https://openalex.org/I67031392" ],
        years: [ 2023, 2022, 2021, 2020, 2019, 2018, 2017 ]
    },
];

// For this particular author, the last known institutions field is an empty list,
// But if it had fields, it follows the same structure as "affiliations" without they "years" fields
const mockResolvedAuthorInstitutions = [];

// Mocking 2/5 topics associated with the current author for simplicity
const mockResolvedAuthorTopics = [
    {
        topic_openalex_id: "T10048",
        topic_display_name: "Particle physics theoretical and experimental studies",
        works_count: 151,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    },
    {
        topic_opeanlex_id: "T10224",
        topic_display_name: "Quantum Chromodynamics and Particle Interactions",
        works_count: 129,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    }
];

// Mocking 2/5 author topic shares for simplicity
const mockResolvedAuthorTopicShares = [
    {
        topic_openalex_id: "T10527",
        topic_display_name: "High-Energy Particle Collisions Research",
        value: 0.00035,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    },
    {
        topic_openalex_id: "T10224",
        topic_display_name: "Quantum Chromodynamics and Particle Interactions",
        value: 0.000327,
        domain_openalex_id: "3",
        domain_display_name: "Physical Sciences",
        field_openalex_id: "31",
        field_display_name: "Physics and Astronomy",
        subfield_openalex_id: "3106",
        subfield_display_name: "Nuclear and High Energy Physics"
    },
];

// Mocking 2/15 author citation counts by year for simplicity
const mockResolvedAuthorCountsByYear = [
    {
        year: 2025,
        works_count: 1,
        oa_works_count: 1,
        cited_by_count: 0
    },
    {
        year: 2023,
        works_count: 3,
        oa_works_count: 3,
        cited_by_count: 20
    },
];

describe("GET /api/authors/:id", () => {
    // Reseting the mock's call history before every test
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("Returns 200 and the author when found", async () => {
        fetchAuthorById.mockResolvedValue(mockResolvedAuthor);
        fetchAuthorAffiliationsById.mockResolvedValue(mockResolvedAuthorAffiliations);
        fetchAuthorLastKnownInstitutionsById.mockResolvedValue(mockResolvedAuthorInstitutions);
        fetchAuthorTopicsById.mockResolvedValue(mockResolvedAuthorTopics);
        fetchAuthorTopicSharesById.mockResolvedValue(mockResolvedAuthorTopicShares);
        fetchAuthorCountsByYearById.mockResolvedValue(mockResolvedAuthorCountsByYear);

        // The route's expected data output
        const expectedOutput = {
            id: mockResolvedAuthor.openalex_id,
            internalId: mockResolvedAuthor.id,
            orcid: mockResolvedAuthor.orcid,

            displayName: mockResolvedAuthor.display_name,
            rawAuthorNames: mockResolvedAuthor.raw_author_names ?? [],
            fullName: mockResolvedAuthor.full_name,

            worksCount: mockResolvedAuthor.works_count,
            citedByCount: mockResolvedAuthor.cited_by_count,
            twoYearMeanCitedness: mockResolvedAuthor.two_year_mean_citedness === null
                ? null
                : Number(mockResolvedAuthor.two_year_mean_citedness),
            hIndex: mockResolvedAuthor.h_index,
            i10Index: mockResolvedAuthor.i10_index,

            worksApiURL: mockResolvedAuthor.works_api_url,
            createdAt: mockResolvedAuthor.openalex_created_at,
            updatedAt: mockResolvedAuthor.openalex_updated_at,

            affiliations: mockResolvedAuthorAffiliations.map(aff => ({
                id: aff.institution_openalex_id,
                institutionRor: aff.institution_ror,
                displayName: aff.institution_display_name,
                countryCode: aff.institution_country_code,
                institutionType: aff.institution_type,
                lineage: aff.lineage,
                years: aff.years
            })),

            lastKnownInstitutions: mockResolvedAuthorInstitutions.map(inst => ({
                id: inst.institution_openalex_id,
                institutionRor: inst.institution_ror,
                displayName: inst.institution_display_name,
                countryCode: inst.institution_country_code,
                institutionType: inst.institution_type,
                lineage: inst.institution_lineage,
            })),

            topics: mockResolvedAuthorTopics.map(topic => ({
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

            topicShares: mockResolvedAuthorTopicShares.map(share => ({
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

            countsByYear: mockResolvedAuthorCountsByYear.map(count => ({
                year: count.year,
                worksCount: count.works_count,
                oaWorksCount: count.oa_works_count,
                citedByCount: count.cited_by_count
            }))
        };

        const response = await request(app).get("/api/authors/A5107860229").expect(200);

        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860229");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorAffiliationsById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorLastKnownInstitutionsById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorLastKnownInstitutionsById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorTopicsById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorTopicsById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorTopicSharesById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorTopicSharesById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorCountsByYearById).toHaveBeenCalledWith("50703");
        expect(fetchAuthorCountsByYearById).toHaveBeenCalledTimes(1);

        expect(response.body.status).toBe("success");
        expect(response.body.data).toEqual(expectedOutput);
    });

    // ------------- USER ERRORS ---------------

    it("Returns 400 when author Id doesn't follow the correct format", async () => {
        fetchAuthorById.mockResolvedValue(null);

        const response = await request(app).get("/api/authors/5107").expect(400);

        expect(fetchAuthorById).not.toHaveBeenCalled();
        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Invalid author Id");
    });


    it("Returns 404 when the author doesn't exist", async () => {
        fetchAuthorById.mockResolvedValue(null);

        const response = await request(app).get("/api/authors/A5107").expect(404);

        expect(fetchAuthorById).toHaveBeenCalledWith("A5107");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("fail");
        expect(response.body.message).toBe("Author not found");
    });

    // -------------- DATABASE ERRORS --------------

    it("Returns 500 when the server fails", async () => {
        fetchAuthorById.mockRejectedValue(new Error("Unexpected failure"));

        const response = await request(app).get("/api/authors/A5107860229").expect(500);

        expect(fetchAuthorById).toHaveBeenCalledWith("A5107860229");
        expect(fetchAuthorById).toHaveBeenCalledTimes(1);

        expect(fetchAuthorAffiliationsById).not.toHaveBeenCalled();
        expect(fetchAuthorLastKnownInstitutionsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicsById).not.toHaveBeenCalled();
        expect(fetchAuthorTopicSharesById).not.toHaveBeenCalled();
        expect(fetchAuthorCountsByYearById).not.toHaveBeenCalled();

        expect(response.body.status).toBe("error");
        expect(response.body.message).toBe("Unexpected failure");
    });
});
