-- TABLES

-- Each Paper record
CREATE TABLE papers (
    -- Paper Identity Fields
    id BIGSERIAL PRIMARY KEY, -- local database unique ID
    openalex_id TEXT NOT NULL UNIQUE,
    doi TEXT,
    title TEXT,
    display_name TEXT NOT NULL, -- display-safe title from OpenAlex
    abstract TEXT,
    
    -- used in Full-Text Search, generated automatically for each tuple
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(title, display_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(abstract, '')), 'B')
    ) STORED, 

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
    author_id BIGINT NOT NULL,

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
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
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
    topic_id BIGINT,

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
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL,
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

-- AUTHORS

-- Each Author in the database
CREATE TABLE authors (
    id BIGSERIAL PRIMARY KEY,
    openalex_id TEXT NOT NULL UNIQUE,
    orcid TEXT,
    display_name TEXT NOT NULL,
    raw_author_names TEXT[],
    full_name TEXT,

    works_count INTEGER DEFAULT 0,
    cited_by_count INTEGER DEFAULT 0,
    two_year_mean_citedness NUMERIC(20, 6),
    h_index INTEGER,
    i10_index INTEGER,

    works_api_url TEXT,
    openalex_created_at TIMESTAMPTZ,
    openalex_updated_at TIMESTAMPTZ
);

-- Each Author is associated with a series of Affiliations
CREATE TABLE author_affiliations (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,

    institution_openalex_id TEXT,
    institution_ror TEXT,
    institution_display_name TEXT NOT NULL,
    institution_country_code TEXT,
    institution_type TEXT,
    lineage TEXT[],
    years INTEGER[],

    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE (author_id, institution_openalex_id)
);

-- Each Author's most recent institution affiliations
CREATE TABLE author_last_known_institutions (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,

    institution_openalex_id TEXT,
    institution_ror TEXT,
    institution_display_name TEXT NOT NULL,
    institution_country_code TEXT,
    institution_type TEXT,
    institution_lineage TEXT[],

    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE(author_id, institution_openalex_id)
)


-- Each Author is associated with a series of Topics
CREATE TABLE author_topics (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,

    topic_openalex_id TEXT,
    topic_display_name TEXT NOT NULL,
    works_count INTEGER DEFAULT 0,

    domain_openalex_id TEXT,
    domain_display_name TEXT NOT NULL,
    field_openalex_id TEXT,
    field_display_name TEXT NOT NULL,
    subfield_openalex_id TEXT,
    subfield_display_name TEXT NOT NULL,

    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE(author_id, topic_openalex_id)
);

-- Each Author's share of work in each topic mentioned
CREATE TABLE author_topic_share (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,

    topic_openalex_id TEXT,
    topic_display_name TEXT NOT NULL,
    value NUMERIC(10, 6),

    domain_openalex_id TEXT,
    domain_display_name TEXT NOT NULL,
    field_openalex_id TEXT,
    field_display_name TEXT NOT NULL,
    subfield_openalex_id TEXT,
    subfield_display_name TEXT NOT NULL,

    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE (author_id, topic_openalex_id)
);

-- Each Author is accompanied by citation data across the years
CREATE TABLE author_counts_by_year (
    id BIGSERIAL PRIMARY KEY,
    author_id BIGINT NOT NULL,

    year INTEGER NOT NULL,
    works_count INTEGER DEFAULT 0,
    oa_works_count INTEGER DEFAULT 0,
    cited_by_count INTEGER DEFAULT 0,

    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,
    UNIQUE (author_id, year)
);

-- TOPICS

CREATE TABLE topics (
    id BIGSERIAL PRIMARY KEY,

    openalex_id TEXT NOT NULL UNIQUE,
    topic_display_name TEXT NOT NULL,
    
    topic_description TEXT,
    topic_keywords TEXT[],

    topic_wikipedia_url TEXT,

    domain_openalex_id TEXT,
    domain_display_name TEXT NOT NULL,
    field_openalex_id TEXT,
    field_display_name TEXT NOT NULL,
    subfield_openalex_id TEXT,
    subfield_display_name TEXT NOT NULL,

    works_count INTEGER DEFAULT 0,
    cited_by_count INTEGER DEFAULT 0,

    works_api_url TEXT,

    openalex_created_at TIMESTAMPTZ,
    openalex_updated_at TIMESTAMPTZ 
);

-- USERS / PROJECT FOLDERS

-- Each individual User in the application
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    affiliation TEXT,
    role TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Each user might create different paper groupings called Project Folders
-- to store series of project-related papers
CREATE TABLE user_folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    summary TEXT,
    paper_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    visibility TEXT NOT NULL DEFAULT 'private',
    color TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, name)
);

-- Implementation of the many-to-many paper-folder relationship
CREATE TABLE user_folder_papers (
    folder_id INTEGER NOT NULL,
    paper_id BIGINT NOT NULL,
    added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, paper_id),
    FOREIGN KEY (folder_id) REFERENCES user_folders(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- Implementation of user search history records
CREATE TABLE user_search_history (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    query TEXT NOT NULL,
    filters JSONB,
    result_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- RECOMMENDATION-RELATED TABLES

-- Interaction metrics of user with a paper
CREATE TABLE user_paper_interactions (
    user_id INTEGER NOT NULL,
    paper_id BIGINT NOT NULL,

    view_count INTEGER NOT NULL DEFAULT 0,
    is_saved BOOLEAN NOT NULL DEFAULT FALSE,
    interest_score NUMERIC(10, 4) NOT NULL DEFAULT 0,

    first_viewed_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, paper_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- Global interaction metrics for each paper
CREATE TABLE paper_metrics (
    paper_id BIGINT PRIMARY KEY,

    view_count INTEGER NOT NULL DEFAULT 0,
    save_count INTEGER NOT NULL DEFAULT 0,
    recommendation_click_count INTEGER NOT NULL DEFAULT 0,

    popularity_score NUMERIC(10, 6) NOT NULL DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
); 

-- Precomputed paper features for recommendation algorithms
CREATE TABLE paper_recommendation_features (
    paper_id BIGINT PRIMARY KEY,

    citation_score NUMERIC(10, 6) NOT NULL DEFAULT 0,
    recency_score NUMERIC(10, 6) NOT NULL DEFAULT 0,

    topic_vector JSONB NOT NULL DEFAULT '{}',
    domain_vector JSONB NOT NULL DEFAULT '{}',
    field_vector JSONB NOT NULL DEFAULT '{}',
    subfield_vector JSONB NOT NULL DEFAULT '{}',
    author_vector JSONB NOT NULL DEFAULT '{}',
    keyword_vector JSONB NOT NULL DEFAULT '{}',

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- Computed user preference profile
CREATE TABLE user_profile_preferences (
    user_id INTEGER PRIMARY KEY,

    topic_preferences JSONB NOT NULL DEFAULT '{}',
    domain_preferences JSONB NOT NULL DEFAULT '{}',
    field_preferences JSONB NOT NULL DEFAULT '{}',
    subfield_preferences JSONB NOT NULL DEFAULT '{}',
    author_preferences JSONB NOT NULL DEFAULT '{}',
    keyword_preferences JSONB NOT NULL DEFAULT '{}',

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Similar users for collaborative filtering
CREATE TABLE user_similarity_cache (
    user_id INTEGER NOT NULL,
    similar_user_id INTEGER NOT NULL,

    similarity_score NUMERIC(10, 6) NOT NULL,

    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, similar_user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (similar_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (user_id <> similar_user_id)
);

-- Final cached paper recommendations per user
CREATE TABLE user_recommendation_cache (
    user_id INTEGER NOT NULL,
    paper_id BIGINT NOT NULL,

    final_score NUMERIC(10, 6) NOT NULL,

    content_score NUMERIC(10, 6) NOT NULL DEFAULT 0,
    collaborative_score NUMERIC(10, 6) NOT NULL DEFAULT 0,
    topic_score NUMERIC(10, 6) NOT NULL DEFAULT 0,
    popularity_score NUMERIC(10, 6) NOT NULL DEFAULT 0,
    recency_score NUMERIC(10, 6) NOT NULL DEFAULT 0,

    reason TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, paper_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

-- Dirty/stale marker for recommendation refresh
CREATE TABLE recommendation_refresh_queue (
    user_id INTEGER PRIMARY KEY,

    reason TEXT,
    priority INTEGER NOT NULL DEFAULT 1,
    
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Similar papers cache
CREATE TABLE paper_similarity_cache (
    paper_id BIGINT NOT NULL,
    similar_paper_id BIGINT NOT NULL,

    similarity_score NUMERIC(10, 6) NOT NULL,
    
    reason TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (paper_id, similar_paper_id),
    FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    FOREIGN KEY (similar_paper_id) REFERENCES papers(id) ON DELETE CASCADE,
    CHECK (paper_id <> similar_paper_id)
);

-- INDEXES (for potential filtering fields)

-- Indexes for the papers table 
CREATE INDEX idx_papers_publication_year ON papers(publication_year);
CREATE INDEX idx_papers_publication_date ON papers(publication_date);
CREATE INDEX idx_papers_cited_by_count ON papers(cited_by_count DESC);
CREATE INDEX idx_papers_fwci ON papers(fwci DESC);
CREATE INDEX idx_papers_is_open_access ON papers(is_open_access);
CREATE INDEX idx_papers_open_access_status ON papers(open_access_status);
CREATE INDEX idx_papers_language ON papers(language);
CREATE INDEX idx_papers_type ON papers(paper_type);
CREATE INDEX idx_papers_primary_source ON papers(primary_source_display_name);
CREATE INDEX idx_papers_primary_topic ON papers(primary_topic_display_name);
CREATE INDEX idx_papers_primary_domain ON papers(primary_domain_display_name);
CREATE INDEX idx_papers_primary_field ON papers(primary_field_display_name);
CREATE INDEX idx_papers_primary_subfield ON papers(primary_subfield_display_name);

-- GIN Index used to speed up Full-Text Search
CREATE INDEX idx_papers_search_vector ON papers USING GIN (search_vector);

-- Indexes for paper_authors table
CREATE INDEX idx_paper_authors_paper_id ON paper_authors(paper_id);
CREATE INDEX idx_paper_authors_display_name ON paper_authors(author_display_name);
CREATE INDEX idx_paper_authors_openalex_id ON paper_authors(author_openalex_id)
WHERE author_openalex_id IS NOT NULL;
CREATE INDEX idx_paper_authors_author_id ON paper_authors(author_id) WHERE author_id IS NOT NULL;

-- Indexes for paper_author_institutions table
CREATE INDEX idx_paper_author_institutions_author_id ON paper_author_institutions(paper_author_id);
CREATE INDEX idx_paper_author_institutions_display_name ON paper_author_institutions(institution_display_name);
CREATE INDEX idx_paper_author_institutions_openalex_id ON paper_author_institutions(institution_openalex_id)
WHERE institution_openalex_id IS NOT NULL;
CREATE INDEX idx_paper_author_institutions_country ON paper_author_institutions(country_code);
CREATE INDEX idx_paper_author_institutions_paper_author_id ON paper_author_institutions(paper_author_id);

-- Indexes for paper_author_affiliations table
CREATE INDEX idx_paper_author_affiliations_paper_author_id ON paper_author_affiliations(paper_author_id);

-- Indexes for paper_topics table
CREATE INDEX idx_paper_topics_paper_id ON paper_topics(paper_id);
CREATE INDEX idx_paper_topics_topic_openalex_id ON paper_topics(topic_openalex_id);
CREATE INDEX idx_paper_topics_name ON paper_topics(topic_display_name);
CREATE INDEX idx_paper_topics_domain ON paper_topics(domain_display_name);
CREATE INDEX idx_paper_topics_field ON paper_topics(field_display_name);
CREATE INDEX idx_paper_topics_subfield ON paper_topics(subfield_display_name);
CREATE INDEX idx_paper_topics_score ON paper_topics(score DESC);

-- Indexes for paper_keywords table
CREATE INDEX idx_paper_keywords_paper_id ON paper_keywords(paper_id);
CREATE INDEX idx_paper_keywords_name ON paper_keywords(keyword_display_name);
CREATE INDEX idx_paper_keyword_score ON paper_keywords(score DESC);

-- Indexes for paper_locations table
CREATE INDEX idx_paper_locations_paper_id ON paper_locations(paper_id);
CREATE INDEX idx_paper_locations_source_name ON paper_locations(source_display_name);
CREATE INDEX idx_paper_locations_source_type ON paper_locations(source_type);
CREATE INDEX idx_paper_locations_is_oa ON paper_locations(is_oa);
CREATE INDEX idx_paper_locations_is_primary ON paper_locations(is_primary);
CREATE INDEX idx_paper_locations_is_best_oa ON paper_locations(is_best_oa);

-- Indexes for paper_references table
CREATE INDEX idx_paper_references_paper_id ON paper_references(paper_id);
CREATE INDEX idx_paper_references_referenced_work ON paper_references(referenced_work_openalex_id);

-- Indexes for paper_related table
CREATE INDEX idx_paper_related_paper_id ON paper_related(paper_id);
CREATE INDEX idx_paper_related_related_work ON paper_related(related_work_openalex_id);

-- Indexes for counts_by_year table
CREATE INDEX idx_paper_counts_by_year_paper_id ON paper_counts_by_year(paper_id);
CREATE INDEX idx_paper_counts_by_year_year ON paper_counts_by_year(year);

-- Indexes for user_folders & user_folder_papers table
CREATE INDEX idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX idx_user_folder_papers_paper_id ON user_folder_papers(paper_id);

-- Indexes for user_search_history
CREATE INDEX idx_user_search_history_user_id_created_at ON user_search_history(user_id, created_at DESC);

-- Indexes for authors
CREATE INDEX idx_authors_display_name ON authors(display_name);
CREATE INDEX idx_authors_orcid ON authors(orcid) WHERE orcid IS NOT NULL;
CREATE INDEX idx_authors_works_count ON authors(works_count DESC);
CREATE INDEX idx_authors_cited_by_count ON authors(cited_by_count DESC);
CREATE INDEX idx_authors_h_index ON authors(h_index DESC);
CREATE INDEX idx_authors_i10_index ON authors(i10_index DESC);

-- Indexes for author_affiliations
CREATE INDEX idx_author_affiliations_author_id ON author_affiliations(author_id);
CREATE INDEX idx_author_affiliations_institution_openalex_id ON author_affiliations(institution_openalex_id)
WHERE institution_openalex_id IS NOT NULL;
CREATE INDEX idx_author_affiliations_institution_display_name ON author_affiliations(institution_display_name);
CREATE INDEX idx_author_affiliations_country_code ON author_affiliations(institution_country_code);
CREATE INDEX idx_author_affiliations_institution_type ON author_affiliations(institution_type);

-- Indexes for author_last_known_institutions
CREATE INDEX idx_author_last_known_institutions_author_id ON author_last_known_institutions(author_id);
CREATE INDEX idx_author_last_known_institutions_institution_openalex_id ON author_last_known_institutions(institution_openalex_id)
WHERE institution_openalex_id IS NOT NULL;
CREATE INDEX idx_author_last_known_institutions_institution_display_name ON author_last_known_institutions(institution_display_name);
CREATE INDEX idx_author_last_known_institutions_country_code ON author_last_known_institutions(institution_country_code);
CREATE INDEX idx_author_last_known_institutions_institution_type ON author_last_known_institutions(institution_type);

-- Indexes for author_topics
CREATE INDEX idx_author_topics_author_id ON author_topics(author_id);
CREATE INDEX idx_author_topics_topic_openalex_id ON author_topics(topic_openalex_id)
WHERE topic_openalex_id IS NOT NULL;
CREATE INDEX idx_author_topics_display_name ON author_topics(topic_display_name);
CREATE INDEX idx_author_topics_works_count ON author_topics(works_count DESC);
CREATE INDEX idx_author_topics_domain ON author_topics(domain_display_name);
CREATE INDEX idx_author_topics_field ON author_topics(field_display_name);
CREATE INDEX idx_author_topics_subfield ON author_topics(subfield_display_name);

-- Indexes for author_topic_shares
CREATE INDEX idx_author_topic_share_author_id ON author_topic_share(author_id);
CREATE INDEX idx_author_topic_share_topic_openalex_id ON author_topic_share(topic_openalex_id)
WHERE topic_openalex_id IS NOT NULL;
CREATE INDEX idx_author_topic_share_display_name ON author_topic_share(topic_display_name);
CREATE INDEX idx_author_topic_share_works_count ON author_topic_share(value DESC);
CREATE INDEX idx_author_topic_share_domain ON author_topic_share(domain_display_name);
CREATE INDEX idx_author_topic_share_field ON author_topic_share(field_display_name);
CREATE INDEX idx_author_topic_share_subfield ON author_topic_share(subfield_display_name);

-- Indexes for author_counts_by_year
CREATE INDEX idx_author_counts_by_year_author_id ON author_counts_by_year(author_id);
CREATE INDEX idx_author_counts_by_year_year ON author_counts_by_year(year);
CREATE INDEX idx_author_counts_by_year_author_year ON author_counts_by_year(author_id, year);
CREATE INDEX idx_author_counts_by_year_cited_by_count ON author_counts_by_year(cited_by_count DESC);
CREATE INDEX idx_author_counts_by_year_works_count ON author_counts_by_year(works_count DESC);

-- Indexes for topics
CREATE INDEX idx_topics_openalex_id ON topics(openalex_id);
CREATE INDEX idx_topics_display_name ON topics(topic_display_name);
CREATE INDEX idx_topics_domain ON topics(domain_openalex_id);
CREATE INDEX idx_topics_field ON topics(field_openalex_id);
CREATE INDEX idx_topics_subfield ON topics(subfield_openalex_id);
CREATE INDEX idx_topics_works_count ON topics(works_count DESC);
CREATE INDEX idx_topics_cited_by_count ON topics(cited_by_count DESC);

-- Indexes for user_paper_interactions
CREATE INDEX idx_user_paper_interactions_interest_score
ON user_paper_interactions(user_id, interest_score DESC);

CREATE INDEX idx_user_paper_interactions ON user_paper_interactions(paper_id);

-- Indexes for paper_metrics
CREATE INDEX idx_paper_metrics_popularity ON paper_metrics(popularity_score DESC);

-- Indexes for paper_recommendation_features
CREATE INDEX idx_paper_recommendation_features_domain_vector
ON paper_recommendation_features USING GIN (domain_vector);

CREATE INDEX idx_paper_recommendation_features_field_vector
ON paper_recommendation_features USING GIN (field_vector);

CREATE INDEX idx_paper_recommendation_features_subfield_vector
ON paper_recommendation_features USING GIN (subfield_vector);

CREATE INDEX idx_paper_recommendation_features_topic_vector
ON paper_recommendation_features USING GIN (topic_vector);

-- Indexes for user_profile_preferences
CREATE INDEX idx_user_profile_preferences_domain_preferences
ON user_profile_preferences USING GIN (domain_preferences);

CREATE INDEX idx_user_profile_preferences_field_preferences
ON user_profile_preferences USING GIN (field_preferences);

CREATE INDEX idx_user_profile_preferences_subfield_preferences
ON user_profile_preferences USING GIN (subfield_preferences);

CREATE INDEX idx_user_profile_preferences_topic_preferences
ON user_profile_preferences USING GIN (topic_preferences);

-- Indexes for user_similarity_cache
CREATE INDEX idx_user_similarity_cache_similarity_score
ON user_similarity_cache(user_id, similarity_score DESC); 

-- Indexes for user_recommendation_cache
CREATE INDEX idx_user_recommendation_cache_final_score
ON user_recommendation_cache(user_id, final_score DESC);

-- Indexes for refresh_recommendation_queue
CREATE INDEX idx_recommendation_refresh_queue_unprocessed
ON recommendation_refresh_queue(requested_at) WHERE processed_at IS NULL;

-- Indexes for paper_similarity_cache
CREATE INDEX idx_paper_similarity_cache_paper_score
ON paper_similarity_cache(paper_id, similarity_score DESC);
