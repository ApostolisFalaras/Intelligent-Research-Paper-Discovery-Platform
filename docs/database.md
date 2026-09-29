# Database Design

This document describes the PostgreSQL data model used by the research paper
discovery platform. It focuses on the major data domains, relationships,
integrity constraints, recommendation data, and indexing strategy rather than
reproducing every column defined in the schema.

For instructions on creating and initializing the database, see
[Local Setup](./setup.md). For the role of PostgreSQL within the overall
application, see [System Architecture](./architecture.md).

## Overview

PostgreSQL is the application's primary persistent data store. The schema
contains research metadata imported from OpenAlex, application users and
user-managed collections, user interaction and recommendation data, and
derived state used to support recommendation and popularity refreshes.

The application schema currently consists of 29 tables. Research metadata is
populated primarily through the OpenAlex data pipeline, while user,
interaction, and recommendation state is managed by the runtime backend.

The database schema is defined in:

```text
database/schema.sql
```

The PostgreSQL-backed session table used by `express-session` is created
separately by `connect-pg-simple` and is therefore not part of the application
schema described in this document.

## Data Domains

The schema can be grouped into the following major domains:

| Domain | Primary Tables |
| --- | --- |
| Research entities | `papers`, `authors`, `topics` |
| Paper metadata and relationships | `paper_authors`, `paper_author_institutions`, `paper_author_affiliations`, `paper_topics`, `paper_keywords`, `paper_locations`, `paper_references`, `paper_related`, `paper_counts_by_year` |
| Author metadata | `author_affiliations`, `author_last_known_institutions`, `author_topics`, `author_topic_share`, `author_counts_by_year` |
| Users and collections | `users`, `user_folders`, `user_folder_papers`, `user_follows_authors` |
| Recommendation data | `user_paper_interactions`, `paper_metrics`, `paper_recommendation_features`, `user_profile_preferences`, `user_similarity_cache`, `user_recommendation_cache` |
| Refresh state | `recommendation_refresh_queue`, `popularity_refresh_state` |

## Core Research Entities

### Papers

The `papers` table is the central research-entity table. Each row represents a
paper imported from OpenAlex and is identified internally by a `BIGSERIAL`
primary key and externally by a unique OpenAlex identifier.

In addition to basic publication metadata, the table stores information used
throughout discovery, filtering, ranking, and recommendation features,
including:

- title and abstract,
- publication year and date,
- language and paper type,
- citation counts and citation-normalized metrics,
- source and bibliographic metadata,
- primary topic, domain, field, and subfield,
- open-access and full-text availability,
- location and institution counts,
- retraction and paratext status, and
- OpenAlex creation and update timestamps.

Several values derived from OpenAlex are intentionally stored directly on the
paper record, such as primary topic and source information. This allows common
paper-list and filtering operations to access frequently required metadata
without reconstructing it from relationship tables.

### Authors

The `authors` table stores authors represented in the local OpenAlex dataset.

Author records include:

- OpenAlex and ORCID identifiers,
- display and normalized name information,
- work and citation counts,
- two-year mean citedness,
- h-index and i10-index values,
- the associated OpenAlex works API URL, and
- OpenAlex creation and update timestamps.

Additional author metadata, including affiliations, topics, topic shares, and
yearly statistics, is normalized into related tables.

### Topics

The `topics` table stores OpenAlex topics used by the application for research
classification and discovery.

Each topic contains its OpenAlex identity and descriptive information together
with its position in the OpenAlex topic hierarchy:

```text
Domain
  ↓
Field
  ↓
Subfield
  ↓
Topic
```

Topic records also store aggregate work and citation counts and the associated
OpenAlex works API URL.

## Paper Relationships and Metadata

Paper metadata that can occur multiple times for a single paper is stored in
separate relationship tables rather than directly on the `papers` row.

### Authorships

`paper_authors` represents the authorship records associated with papers.

Each authorship belongs to one paper and stores the author's position and
paper-specific authorship metadata, including:

- author ordering,
- OpenAlex identity,
- display and raw names,
- ORCID,
- author position, and
- corresponding-author status.

The table also links authorship records to local `authors` records through
`author_id`.

The combination of `paper_id` and `author_order` is unique, preserving a
single author entry at each position in a paper's ordered author list.

Authorship-specific institutions and raw affiliations are stored separately in:

- `paper_author_institutions`
- `paper_author_affiliations`

Both tables reference `paper_authors`, allowing a single authorship to contain
multiple institutions and affiliation strings.

### Paper Topics

`paper_topics` represents the topics associated with each paper.

Each relationship stores:

- the OpenAlex topic identity,
- topic display name,
- topic relevance score,
- domain, field, and subfield information, and
- whether the topic is the paper's primary topic.

Where the corresponding topic exists in the local topic dataset, `topic_id`
links the relationship to the `topics` table.

A paper cannot contain duplicate topic entries with the same display name.

### Keywords

`paper_keywords` stores OpenAlex keywords associated with each paper together
with their relevance scores.

The combination of paper and keyword display name is unique.

### Locations

`paper_locations` stores the locations at which a paper can be accessed.

A location can include:

- landing-page and PDF URLs,
- source identity and source metadata,
- ISSN information,
- open-access status,
- license and version information,
- host-organization metadata, and
- primary or best-open-access status.

This allows a single paper to retain multiple publication, repository, or
other access locations while the `papers` table stores the primary and
best-open-access summary information required by common application queries.

### References and Related Works

Two tables represent OpenAlex relationships between papers:

- `paper_references` stores works cited by a paper.
- `paper_related` stores works OpenAlex identifies as related.

These relationships store the referenced or related work by OpenAlex
identifier rather than requiring the target work to exist as a local
`papers` row. This allows relationships to be retained even when the external
work is outside the locally ingested paper dataset.

### Paper Counts by Year

`paper_counts_by_year` stores yearly citation counts for papers.

Each `(paper_id, year)` combination is unique, allowing citation history to be
represented independently from the current aggregate citation count stored on
`papers`.

## Author Relationships and Metadata

Author metadata with one-to-many cardinality is stored separately from the
core `authors` table.

### Affiliations

`author_affiliations` stores institutions with which an author has been
affiliated.

Records include institution identifiers, display information, country and
institution type, organizational lineage, and the years associated with the
affiliation.

`author_last_known_institutions` separately stores the author's most recently
known institutional relationships.

Both tables cascade when their parent author is removed.

### Author Topics

`author_topics` stores topics associated with an author's body of work,
including the number of works associated with each topic and its domain,
field, and subfield hierarchy.

`author_topic_share` separately stores a numeric topic-share value for each
author-topic relationship together with the same domain, field, and subfield
hierarchy.

### Author Counts by Year

`author_counts_by_year` stores yearly author statistics, including:

- total works,
- open-access works, and
- citation counts.

Each author can have at most one record for a given year.

## Users and Collections

### Users

The `users` table stores application accounts and profile information.

Each user has unique username and email values together with a password hash.
Optional profile data includes name, affiliation, location, role, biography,
and avatar information.

The table also records account creation, update, and most recent login
timestamps.

Authentication session data is not stored directly in this table. Runtime
session state is maintained separately through the PostgreSQL-backed session
store.

### Project Folders

Users can organize papers into project folders through two tables:

```text
users
  ↓
user_folders
  ↓
user_folder_papers
  ↓
papers
```

`user_folders` stores folder metadata such as:

- name,
- summary,
- paper count,
- pinned state,
- visibility,
- color and icon, and
- creation and update timestamps.

Folder names are unique per user.

`user_folder_papers` implements the many-to-many relationship between folders
and papers using the composite primary key:

```text
(folder_id, paper_id)
```

The relationship also records when the paper was added to the folder.

### Followed Authors

`user_follows_authors` implements the many-to-many relationship between users
and authors.

Its composite primary key:

```text
(user_id, author_id)
```

prevents a user from following the same author more than once.

## Recommendation Data Model

The recommendation subsystem uses separate tables for raw interaction signals,
derived paper features, user profiles, collaborative-filtering state, and
final recommendation results.

The high-level data flow is:

```text
User Interactions
       ↓
┌─────────────────────┐
│ Interaction History │
│ Global Paper Metrics│
└─────────────────────┘
       ↓
User Preference Profile
       ↓
User Similarity
       ↓
Recommendation Scoring
       ↓
Recommendation Cache
```

For details about recommendation generation and scoring, see
[Recommendation System](./recommendation-system.md).

### User-Paper Interactions

`user_paper_interactions` stores user-specific interaction state for each
paper.

The composite primary key:

```text
(user_id, paper_id)
```

ensures that the interaction history for a user and paper is accumulated into
a single record.

Stored signals include:

- view count,
- saved state,
- first-view timestamp, and
- most recent interaction timestamp.

These records provide behavioral input for user-profile and recommendation
generation.

### Global Paper Metrics

`paper_metrics` stores aggregate interaction metrics for individual papers.

The table tracks:

- view count,
- save count,
- recommendation click count, and
- computed popularity score.

Unlike `user_paper_interactions`, these values represent application-wide
paper activity rather than the behavior of an individual user.

Each paper can have at most one metrics record.

### Paper Recommendation Features

`paper_recommendation_features` stores precomputed features used by the
recommendation algorithms.

Scalar features include citation and recency scores. Multi-valued categorical
features are represented as `JSONB` vectors for:

- topics,
- domains,
- fields,
- subfields,
- authors, and
- keywords.

These precomputed representations allow recommendation calculations to reuse
derived paper features rather than repeatedly reconstructing them from the
underlying research metadata.

### User Preference Profiles

`user_profile_preferences` stores a computed preference profile for each user.

Preferences are represented as `JSONB` mappings across the same major feature
spaces used by paper recommendation features:

- topics,
- domains,
- fields,
- subfields,
- authors, and
- keywords.

Each user has at most one current preference-profile record.

### User Similarity Cache

`user_similarity_cache` stores precomputed similarity values between users for
collaborative recommendation logic.

Each relationship is identified by:

```text
(user_id, similar_user_id)
```

and contains a computed `similarity_score`.

A database check constraint prevents a user from being stored as similar to
themselves.

### Recommendation Cache

`user_recommendation_cache` stores the final ranked recommendations generated
for each user.

Each cached recommendation contains:

- final hybrid score,
- content-based score,
- collaborative score,
- topic score,
- popularity score,
- recency score, and
- a recommendation reason.

The composite primary key:

```text
(user_id, paper_id)
```

ensures that a paper appears at most once in a user's recommendation cache.

Persisting final recommendations separates expensive recommendation
computation from normal recommendation retrieval.

## Refresh State

Recommendation and popularity updates are tracked separately from the data
they eventually rebuild.

### Recommendation Refresh Queue

`recommendation_refresh_queue` acts as a per-user stale marker for personalized
recommendations.

Each user can have at most one queue record. The record stores:

- the reason for the refresh,
- refresh priority,
- when the refresh was requested, and
- when it was processed.

Pending records are those whose `processed_at` value is `NULL`.

The background recommendation workflow processes stale users and updates this
state after their recommendation data has been rebuilt.

### Popularity Refresh State

`popularity_refresh_state` tracks whether global popularity scores require
refreshing.

This is intentionally a singleton table. Its primary key is constrained to:

```text
id = 1
```

and the schema initializes that row when the database is created.

The row tracks:

- the number of pending popularity-affecting events,
- the timestamp of the most recent event, and
- the timestamp of the most recent popularity refresh.

This allows global popularity invalidation to be tracked without creating a
separate queue record for every interaction.

## Referential Integrity

Foreign keys connect application-owned entities and define cleanup behavior
when parent records are removed.

Dependent metadata that cannot meaningfully exist without its parent generally
uses `ON DELETE CASCADE`. For example:

```text
papers
  ├── paper_keywords
  ├── paper_locations
  ├── paper_references
  ├── paper_related
  └── paper_counts_by_year
```

Deleting a paper therefore removes metadata that cannot meaningfully exist
without that paper.

The same pattern is used for user-owned state:

```text
users
  ├── user_folders
  ├── user_follows_authors
  ├── user_paper_interactions
  ├── user_profile_preferences
  ├── user_similarity_cache
  ├── user_recommendation_cache
  └── recommendation_refresh_queue
```

Composite primary keys and unique constraints are also used extensively to
enforce relationship-level invariants, including:

- one paper per folder membership,
- one followed-author relationship per user and author,
- one interaction record per user and paper,
- one similarity record per user pair,
- one cached recommendation per user and paper,
- one yearly-count record per entity and year, and
- one topic or keyword association of the same identity per parent entity.

## Full-Text Search

The `papers` table contains a generated PostgreSQL `tsvector` column named
`search_vector`.

The vector combines searchable paper text with different weights:

```text
Title / Display Name → Weight A
Abstract             → Weight B
```

The value is generated and stored automatically by PostgreSQL whenever the
underlying paper text changes.

A GIN index on `search_vector` supports efficient PostgreSQL full-text search:

```sql
CREATE INDEX idx_papers_search_vector
ON papers USING GIN (search_vector);
```

This keeps full-text-search preparation inside the database and avoids
constructing the weighted search vector for every search request.

## JSONB Feature Storage

The recommendation subsystem uses `JSONB` for sparse feature mappings whose
keys vary between papers and users.

Examples include:

```text
paper_recommendation_features.topic_vector
paper_recommendation_features.author_vector
user_profile_preferences.topic_preferences
user_profile_preferences.author_preferences
```

This representation allows variable sets of weighted research entities to be
stored without requiring a separate relational row for every individual
feature weight.

GIN indexes are defined for the domain, field, subfield, and topic vectors in
`paper_recommendation_features` and for the corresponding preference mappings
in `user_profile_preferences`.

## Indexing Strategy

Indexes are defined around the application's primary retrieval, filtering,
sorting, relationship, and recommendation access patterns.

### Paper Discovery

The `papers` table includes indexes for commonly queried discovery fields,
including:

- publication year and date,
- citation count,
- field-weighted citation impact,
- open-access state and status,
- language,
- paper type,
- primary source,
- primary topic,
- domain,
- field, and
- subfield.

The full-text `search_vector` uses a GIN index.

### Relationship Lookups

Foreign-key and identity fields used to retrieve related metadata are indexed
across paper and author relationship tables.

Examples include:

- paper-to-author lookup,
- author-to-affiliation lookup,
- paper-to-topic lookup,
- paper-to-keyword lookup,
- paper-to-location lookup,
- referenced and related OpenAlex identifiers, and
- yearly statistics.

### Recommendation Retrieval

Recommendation-specific indexes support:

- ordering papers by popularity score,
- querying JSONB recommendation feature vectors,
- querying JSONB user preference mappings,
- ordering similar users by similarity score,
- ordering cached recommendations by final score, and
- locating pending recommendation refresh records.

Several refresh indexes are partial indexes restricted to rows whose
`processed_at` value is `NULL`, focusing those indexes on work that remains
pending.

## Identifier Strategy

The schema distinguishes between local database identifiers and external
OpenAlex identifiers.

Core imported entities use local numeric primary keys:

```text
papers.id
authors.id
topics.id
```

while retaining their unique external identities:

```text
papers.openalex_id
authors.openalex_id
topics.openalex_id
```

Local numeric identifiers are used for internal foreign-key relationships
where both entities are represented in the local database.

Some externally defined relationships instead retain OpenAlex identifiers
directly. Paper references and related works are examples of this approach,
because the referenced external work is not required to exist in the local
paper dataset.

This allows the database to maintain efficient internal relationships without
discarding relationships to OpenAlex entities outside the locally ingested
dataset.

## Schema Ownership and Initialization

The application schema is maintained in:

```text
database/schema.sql
```

The schema file creates the application tables, integrity constraints,
initial singleton state, and indexes required by the application.

Research metadata is populated after schema initialization by the OpenAlex
data pipeline. Runtime application data, such as users, folders, interactions,
and recommendation refresh state, is subsequently managed by the Express
backend.

The `user_sessions` table is an exception: it belongs to the session-storage
infrastructure and is created automatically by `connect-pg-simple` when
required rather than by `database/schema.sql`.

For database creation and initialization commands, see [Local Setup](./setup.md).