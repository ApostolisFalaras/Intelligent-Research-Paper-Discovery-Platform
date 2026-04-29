CREATE TABLE papers (
    -- Paper Identity Fields
    id BIGSERIAL PRIMARY KEY, -- local database unique ID
    openalex_id TEXT NOT NULL UNIQUE,
    doi TEXT,
    title TEXT,
    display_name TEXT NOT NULL, -- display-safe title from OpenAlex
    abstract TEXT,

    -- Publication Metadata
    publication_year INTEGER,
    publication_date DATE,
    language TEXT, 
    paper_type TEXT, -- article, preprint, dataset, dissertation, book-chapter

    -- Citation-Related Fields
    cited_by_count INTEGER DEFAULT 0, -- # of papers citing this paper
    fwci NUMERIC(12,4), -- Field-Weighted Citation Impact: (actual citations)/(expected citations)
    citation_normalized_percentile_value NUMERIC(6,4), -- Where the paper ranks among similar papers [0.0, 1.0]
    citation_top_1_percent BOOLEAN, -- Citation normalized percentile value >= 0.99 compared to papers of same type/year/field(or sub-field)
    citation_top_10_percent BOOLEAN, -- Citation normalized percentile value >= 0.90 compared to papers of same type/year/field(or sub-field)
    cited_by_percentile_year_min INTEGER, -- Paper's min citation percentile value in the year it's published
    cited_by_percentile_year_max INTEGER, -- Paper's max citation percentile value in the year it's published
    referenced_works_count INTEGER DEFAULT 0, -- Number of citations in this paper

    -- Primary Source/Venue and Location of paper 
    primary_source_openalex_id TEXT,
    primary_source_display_name TEXT, -- Paper's main source name
    primary_source_type TEXT, -- Main source type, such as journal, conference, repository, book etc.
    biblio_volume TEXT, -- journal/book volume
    biblio_issue TEXT, -- journal/book issue (specific release)
    biblio_first_page TEXT,
    biblio_last_page TEXT,
    
    -- Domain of Expertise
    primary_topic_openalex_id TEXT,
    primary_topic_display_name TEXT, -- Main Research Topic
    primary_domain_openalex_id TEXT,
    primary_domain_display_name TEXT, -- Top-level discipline the paper belongs to
    primary_field_openalex_id TEXT,
    primary_field_display_name TEXT, -- Broader research area in that discipline
    primary_subfield_openalex_id TEXT,
    primary_subfield_display_name TEXT, -- Subcategory the paper belongs to

    -- Locations, Countries, Institutions
    locations_count INTEGER DEFAULT 0,
    countries_distinct_count INTEGER,
    institutions_distinct_count INTEGER,
    
    -- Open Accessibility
    is_open_access BOOLEAN, -- Is the paper free to access
    open_access_status TEXT, -- Type of access (gold, green, hybrid, bronze, diamond, closed)
    open_access_best_url TEXT, -- It's the best link to access the paper for free
    open_access_any_repo_has_fulltext BOOLEAN, -- If publisher is paywalled, there might be a free repo version of the paper
    has_fulltext BOOLEAN, -- If any full text exists for this paper, even if paywalled or not available for download
    has_content_pdf BOOLEAN, -- If there exists a downloadable PDF version for the paper
    has_content_grobid_xml BOOLEAN, -- If a machine-readable structured version of the paper exists (GROBID converts PDFs to structured XML, format useful for NLP, text mining, semantic parsing) 
    indexed_in TEXT[], -- Array showing which academic platforms have recorded the paper in their system
    
    -- Other Metadata
    is_retracted BOOLEAN DEFAULT FALSE, -- If the paper's been revoked
    is_paratext BOOLEAN DEFAULT FALSE, -- If it's not an actual paper, but a front cover, contents, etc.

    openalex_created_at TIMESTAMPTZ,
    openalex_updated_at TIMESTAMPTZ
);

-- Each Paper is linked to multiple Authorships
CREATE TABLE paper_authors (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    -- Used in cases where author id's are null, but we still need to display the author
    author_order INT NOT NULL, 

    -- Author Info regarding the Paper
    author_openalex_id TEXT,
    author_display_name TEXT NOT NULL,
    author_orcid TEXT,
    author_position TEXT,
    is_corresponding BOOLEAN DEFAULT FALSE, -- The contact author for the paper, the one handling revisions and submissions
    raw_author_name TEXT,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE(paper_id, author_order)
);

-- Each Authorship is linked to multiple Institutions
CREATE TABLE paper_author_institutions (
    id BIGSERIAL PRIMARY KEY,
    paper_author_id BIGINT NOT NULL,

    -- Institution Information regarding the Authorship
    institution_openalex_id TEXT,
    institution_display_name TEXT NOT NULL,
    institution_ror TEXT, -- Research Organization Registry (ROR), global standardized ID for research institutions
    country_code TEXT,
    institution_type TEXT,
    lineage TEXT[], -- The hierarchy of parent organizations that the institution belongs to

    FOREIGN KEY (paper_author_id) REFERENCES paper_authors(id) ON DELETE CASCADE,
    UNIQUE(paper_author_id, institution_display_name)
);

-- Each Authorship is linked to multiple Affiliations
CREATE TABLE paper_author_affiliations (
    id BIGSERIAL PRIMARY KEY,
    paper_author_id BIGINT NOT NULL,

    -- Affiliation Information regarding the Authorship
    raw_affiliation_string TEXT NOT NULL,
    institution_ids TEXT[] DEFAULT '{}',

    FOREIGN KEY (paper_author_id) REFERENCES paper_authors(id) ON DELETE CASCADE
);

-- Each Paper is associated with a series of Topics
CREATE TABLE paper_topics (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    -- Topic Information
    topic_openalex_id TEXT, 
    topic_display_name TEXT NOT NULL, -- Research Topic
    score NUMERIC(24,16), -- Denotes how much the paper fits in the current topic, values in [0,1]

    domain_openalex_id TEXT,
    domain_display_name TEXT, -- Top-level discipline the paper belongs to
    field_openalex_id TEXT,
    field_display_name TEXT, -- Broader research area in that discipline
    subfield_openalex_id TEXT,
    subfield_display_name TEXT, -- Subcategory the paper belongs to

    is_primary_topic BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE (paper_id, topic_display_name)
);

-- Each Paper has a set of related keywords that enhance the search capabilities of the application
CREATE TABLE paper_keywords (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    -- Keyword Information
    keyword_openalex_id TEXT,
    keyword_display_name TEXT NOT NULL,
    score NUMERIC(24,16),  -- Denotes how important the keyword is in the current paper, values in [0,1]

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE (paper_id, keyword_display_name)
);

-- Each Paper may have a valid copy in multiple Locations
CREATE TABLE paper_locations (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    -- Location Information
    location_openalex_id TEXT,
    is_oa BOOLEAN,
    landing_page_url TEXT,
    pdf_url TEXT,
    
    source_openalex_id TEXT,
    source_display_name TEXT,
    source_issn_l TEXT,
    source_issn TEXT[],
    source_is_oa BOOLEAN,
    source_is_in_doaj BOOLEAN,
    source_is_core BOOLEAN,
    source_host_organization TEXT,
    source_host_organization_name TEXT,
    source_host_organization_lineage TEXT[],
    source_type TEXT,

    license TEXT,
    license_id TEXT,
    version TEXT,
    
    is_accepted BOOLEAN, -- If the paper is accepted by peer review
    is_published BOOLEAN,

    raw_source_name TEXT,
    raw_type TEXT,

    is_primary BOOLEAN DEFAULT FALSE,
    is_best_oa BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE (paper_id, location_openalex_id)
);

-- Each Paper cites a sequence of other Papers
CREATE TABLE paper_references (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    referenced_work_openalex_id TEXT NOT NULL,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE (paper_id, referenced_work_openalex_id)
);

-- Each Paper is also associated with a set of Related Papers
CREATE TABLE paper_related (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    related_work_openalex_id TEXT NOT NULL,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE(paper_id, related_work_openalex_id)
);

-- Each Paper keeps additional info about the number of citations per year
CREATE TABLE paper_counts_by_year (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,

    year INTEGER NOT NULL,
    cited_by_count INTEGER DEFAULT 0,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    UNIQUE(paper_id, year)
);

-- Each individual User in the application
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Each user might create different paper groupings called Project Folders
-- to store series of project-related papers
CREATE TABLE project_folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

-- Implementation of the many-to-many paper-folder relationship
CREATE TABLE project_folder_papers (
    folder_id INTEGER NOT NULL,
    paper_id BIGINT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, paper_id),
    FOREIGN KEY (folder_id) REFERENCES project_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);