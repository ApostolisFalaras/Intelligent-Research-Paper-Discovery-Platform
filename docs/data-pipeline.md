# OpenAlex Data Pipeline

This document describes the Python data pipeline used to construct the research
dataset consumed by the research paper discovery platform.

The pipeline retrieves research metadata from OpenAlex, stores raw API
responses, transforms them into normalized intermediate files, and ingests the
processed data into PostgreSQL.

For installation, environment configuration, and execution commands, see
[Local Setup](./setup.md). For the resulting PostgreSQL data model, see
[Database Design](./database.md).

## Overview

The data pipeline is implemented as a separate Python component under:

```text
openalex_data_pipeline/
```

It operates independently from the runtime React and Express applications and
is used to construct the research dataset before the application consumes it.

The pipeline follows three general stages:

```text
OpenAlex API
     ↓
   Fetch
     ↓
Raw JSON Data
     ↓
 Preprocess
     ↓
Processed JSONL
     ↓
   Ingest
     ↓
 PostgreSQL
```

The same fetch → preprocess → ingest pattern is applied to four dependent
dataset groups:

```text
Main Works
     ↓
Referenced and Related Works
     ↓
Authors
     ↓
Topics
```

Each group is completed before the next group begins because later stages use
data produced by earlier stages to determine which OpenAlex entities should be
retrieved or to establish local database relationships.

## Pipeline Structure

The pipeline source is organized by dataset and responsibility:

```text
openalex_data_pipeline/
├── scripts/
│   ├── main_works/
│   │   ├── fetch_works.py
│   │   ├── preprocess_works.py
│   │   └── ingest_works.py
│   │
│   ├── referenced_related_works/
│   │   ├── fetch_ref_rel_works.py
│   │   ├── preprocess_ref_rel_works.py
│   │   └── ingest_ref_rel_works.py
│   │
│   ├── authors/
│   │   ├── fetch_authors.py
│   │   ├── preprocess_authors.py
│   │   └── ingest_authors.py
│   │
│   ├── topics/
│   │   ├── fetch_topics.py
│   │   ├── preprocess_topics.py
│   │   └── ingest_topics.py
│   │
│   ├── ingestion/
│   │   ├── ingestion_utils.py
│   │   └── works_ingestion_utils.py
│   │
│   ├── utils/
│   │   ├── logging_utils.py
│   │   └── openalex_utils.py
│   │
│   └── demo_users/
│       └── create_recommendation_test_users.py
│
├── .env.example
└── requirements.txt
```

The dataset-specific directories contain the three main pipeline stages, while
the `ingestion` and `utils` packages contain behavior shared across multiple
stages.

The `demo_users` script is separate from the OpenAlex ingestion process and is
not required to construct the research dataset.

## Data Storage Layout

Pipeline execution creates local directories for raw data, processed data,
checkpoints, and logs.

At a high level:

```text
openalex_data_pipeline/
├── data/
│   ├── raw/
│   │   ├── works/
│   │   │   └── <topic_id>/
│   │   │       ├── most_cited/
│   │   │       ├── most_recent/
│   │   │       └── most_recent_cited/
│   │   ├── referenced_related_works/
│   │   │   ├── batches/
│   │   │   └── ids_to_fetch.json
│   │   ├── authors/
│   │   │   ├── batches/
│   │   │   └── ids_to_fetch.json
│   │   └── topics/
│   │       ├── batches/
│   │       ├── fetch_openalex_topics.json
│   │       └── ids_to_fetch.json
│   │
│   └── processed/
│       ├── works/
│       │   ├── per_topic/
│       │   └── global/
│       │       └── works.jsonl
│       ├── referenced_related_works/
│       │   └── ref_rel_works.jsonl
│       ├── authors/
│       │   └── authors.jsonl
│       └── topics/
│           └── topics.jsonl
│
├── checkpoints/
└── logs/
```

Raw files preserve OpenAlex responses before transformation. Processed files
use JSON Lines (`.jsonl`) as the intermediate representation consumed by the
ingestion scripts.

Checkpoints record completed API-fetch work so long-running retrieval stages
can resume without repeating all previously completed requests.

Logs provide execution information for fetch, preprocessing, and ingestion
operations.

Generated pipeline data, checkpoints, and logs are execution artifacts and are
not part of the committed source dataset.

## Environment Configuration

The pipeline requires both OpenAlex API access and PostgreSQL connection
configuration.

The environment contract is defined by:

```text
openalex_data_pipeline/.env.example
```

with the following variables:

```env
OPENALEX_API_KEY=your_openalex_api_key

DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
```

The OpenAlex API key is used by fetch operations. PostgreSQL configuration is
required by ingestion stages and by fetch stages that derive additional entity
IDs from data already stored in the database.

Secrets are supplied through the local environment and are not stored in
generated request metadata.

## Stage 1: Main Works

The main-works stage constructs the initial paper dataset.

It first selects a set of OpenAlex topics and then retrieves papers associated
with those topics according to several ranking strategies.

### Topic Selection

The fetch stage requests the 100 OpenAlex topics with the highest
`works_count`.

The resulting topic metadata is cached locally in:

```text
data/raw/topics/fetch_openalex_topics.json
```

If this file already exists, the fetch stage reuses it instead of requesting
the top topics again.

These topics define the initial subject coverage of the main paper dataset.

### Work Sampling Strategy

For each of the 100 selected topics, the pipeline requests papers using three
buckets:

| Bucket | Maximum Batches | Sort / Filter |
| --- | ---: | --- |
| `most_cited` | 70 | citation count descending |
| `most_recent` | 20 | publication date descending |
| `most_recent_cited` | 10 | citation count descending, publications from 2020 onward |

Each OpenAlex response requests up to 100 works.

The intended maximum retrieval per topic is therefore:

```text
70 × 100 = 7,000 most-cited works
20 × 100 = 2,000 most-recent works
10 × 100 = 1,000 recent highly-cited works
────────────────────────────────────────────
           10,000 requested works per topic
```

Because the same paper can appear in multiple topics or sampling buckets, this
does not imply that the final dataset contains one million unique papers.

The sampling strategy intentionally combines citation-based and recency-based
selection rather than constructing the initial dataset from only one ranking
criterion.

### Cursor Pagination

Main-work retrieval uses OpenAlex cursor pagination.

Each topic and bucket starts with:

```text
cursor = "*"
```

The `next_cursor` returned by OpenAlex is stored after each successful batch
and used to retrieve the following batch.

Fetching stops early when OpenAlex returns no results or no next cursor.

### Raw Main-Work Storage

Each fetched response is stored separately according to its topic, bucket, and
batch number:

```text
data/raw/works/
└── <topic_id>/
    ├── most_cited/
    │   ├── batch_0001.json
    │   └── ...
    ├── most_recent/
    │   └── ...
    └── most_recent_cited/
        └── ...
```

Each raw batch records:

- the topic identifier,
- bucket name,
- batch number,
- sanitized request parameters, and
- the complete OpenAlex response.

This preserves the API response and enough retrieval metadata to trace where a
raw batch originated.

### Main-Work Checkpointing

Progress is stored in:

```text
checkpoints/fetch_openalex_works_checkpoints.json
```

Checkpoint state is tracked independently by:

```text
topic
  ↓
bucket
  ↓
batch
```

For each completed batch, the checkpoint stores whether the batch completed,
the next OpenAlex cursor, and the generated output file.

Checkpoint updates are first written to a temporary file and then atomically
replace the previous checkpoint file.

When the fetch process is restarted, completed batches are skipped and their
stored cursors are used to continue retrieval.

### Main-Work Preprocessing

Raw OpenAlex responses are converted into normalized work records.

Preprocessing performs transformations required before database ingestion,
including reconstruction of abstracts from OpenAlex's inverted-index
representation.

The preprocessing stage first creates per-topic JSONL output and then combines
the processed records into the global file:

```text
data/processed/works/global/works.jsonl
```

This global JSONL file is the input to the main-work ingestion stage.

### Main-Work Ingestion

Processed works are read in batches of:

```text
5,000 records
```

Before insertion, works whose publication year falls outside the supported
range are rejected.

The current accepted publication-year range is:

```text
1800–2026
```

For each valid work batch, ingestion:

1. inserts or updates the core `papers` records,
2. creates paper-authorship records,
3. prepares related paper metadata, and
4. inserts the remaining paper relationship data.

The additional data includes:

- author institutions,
- raw author affiliations,
- topics,
- keywords,
- locations,
- referenced works,
- related works, and
- citation counts by year.

Recommendation feature data associated with papers is also derived during the
shared work-ingestion process.

Each ingestion batch is committed independently. If processing of the current
batch fails, that transaction is rolled back before the error is propagated.

## Stage 2: Referenced and Related Works

The second dataset stage expands the initial paper collection using the
references and related-work relationships discovered during main-work
ingestion.

Unlike the initial stage, this stage does not begin with a fixed set of topic
queries. It derives candidate OpenAlex work identifiers from PostgreSQL.

### Candidate Selection

The fetch stage first retrieves all OpenAlex identifiers already present in
the `papers` table.

It then aggregates:

```text
paper_references.referenced_work_openalex_id
```

and:

```text
paper_related.related_work_openalex_id
```

according to how frequently each external work occurs in the existing
dataset.

Works already present in `papers` are excluded.

For each remaining work, the pipeline calculates:

```text
connection_count = reference_count + related_count
```

Candidates are ranked primarily by this combined connection count, with
related-work count and reference count used as additional ordering criteria.

The first:

```text
100,000
```

ranked identifiers are selected for retrieval.

The selected IDs are cached in:

```text
data/raw/referenced_related_works/ids_to_fetch.json
```

allowing subsequent executions to reuse the calculated candidate set.

### Batched OpenAlex Retrieval

Referenced and related work IDs are requested from OpenAlex in batches of:

```text
100 IDs
```

Raw responses are stored under:

```text
data/raw/referenced_related_works/batches/
```

A dedicated checkpoint records completed batches so the retrieval can resume
without repeating completed API requests.

### Preprocessing

Fetched works are normalized using the same general representation required by
work ingestion.

As with main works, OpenAlex abstract inverted indexes are reconstructed into
plain abstract text.

The processed output is written to:

```text
data/processed/referenced_related_works/ref_rel_works.jsonl
```

### Ingestion

Referenced and related works reuse the shared work-ingestion utilities used by
the main dataset.

They therefore populate the same paper and paper-metadata tables rather than
being stored in a separate database model.

Processed records are ingested in batches of 5,000, and the same supported
publication-year validation is applied.

This stage expands the local paper graph with highly connected works that were
identified through the references and related-work relationships of the
initial dataset.

## Stage 3: Authors

Once the paper dataset has been constructed, the pipeline retrieves full
OpenAlex metadata for authors represented by those papers.

### Author Selection

Candidate author IDs are derived from the `paper_authors` table.

The pipeline groups authors by their OpenAlex identifier, counts how frequently
each author appears in paper authorships, and orders the results by occurrence
count.

The query limits the candidate set to:

```text
1,000,000 authors
```

The selected IDs are cached in:

```text
data/raw/authors/ids_to_fetch.json
```

### Author Retrieval

Authors are requested from the OpenAlex authors endpoint in batches of:

```text
100 IDs
```

Raw responses are written to:

```text
data/raw/authors/batches/
```

Completed batch numbers are stored in a dedicated author checkpoint.

### Author Preprocessing

Raw OpenAlex author responses are normalized and combined into:

```text
data/processed/authors/authors.jsonl
```

The processed representation contains the author data required by the core
author record and its associated metadata tables.

### Author Ingestion

Authors are ingested in batches of:

```text
5,000 records
```

The ingestion stage first inserts the core `authors` records and then
constructs metadata for:

- author affiliations,
- last-known institutions,
- author topics,
- author topic-share values, and
- yearly author statistics.

Each batch is committed independently.

After all author records and their metadata have been ingested, the pipeline
updates existing `paper_authors` rows so their OpenAlex author identifiers are
resolved to the corresponding local:

```text
authors.id
```

This post-ingestion linking step is why author ingestion occurs after the paper
dataset has already populated the authorship relationships.

## Stage 4: Topics

The final OpenAlex dataset stage expands the topic dataset beyond the original
100 topics used to seed main-work retrieval.

### Initial Topics

The original top-100 topics have already been retrieved during the main-work
stage and stored in:

```text
data/raw/topics/fetch_openalex_topics.json
```

These form the initial set of topic IDs that do not need to be fetched again.

### Additional Topic Discovery

The topic stage discovers additional topic IDs from three sources:

1. topics associated with the fetched author metadata,
2. topics associated with processed referenced and related works, and
3. distinct topic OpenAlex IDs already present in the database's
   `paper_topics` relationships.

The three sets are combined and deduplicated.

IDs belonging to the already-fetched top-100 topic set are then removed.

The remaining identifiers form the additional topic-fetch set and are cached
in:

```text
data/raw/topics/ids_to_fetch.json
```

This means the final topic dataset is driven by the entities that actually
occur in the locally constructed paper and author dataset rather than only by
the original 100 seed topics.

### Topic Retrieval

Additional topics are requested from OpenAlex in batches of:

```text
100 IDs
```

Raw batch responses are stored under:

```text
data/raw/topics/batches/
```

Completed batches are recorded in a dedicated topic checkpoint.

### Topic Preprocessing

Topic preprocessing combines both sources of topic metadata:

```text
Top-100 Seed Topics
        +
Additional Topic Batches
        ↓
data/processed/topics/topics.jsonl
```

The result is a single processed topic dataset used by ingestion.

### Topic Ingestion

Topics are ingested into PostgreSQL in batches of:

```text
5,000 records
```

After topic records have been inserted, the pipeline updates existing
`paper_topics` relationships by resolving their OpenAlex topic identifiers to
local:

```text
topics.id
```

As with authors, this final linking step establishes local foreign-key
relationships after the corresponding OpenAlex entities have been ingested.

## Dependency Flow

The execution order is significant because each stage builds on data produced
by previous stages.

```text
┌──────────────────────────────────────┐
│ 1. Main Works                       │
│                                      │
│ OpenAlex topics → papers             │
│                 → authorship IDs     │
│                 → topic IDs          │
│                 → references         │
│                 → related works      │
└──────────────────┬───────────────────┘
                   ↓
┌──────────────────────────────────────┐
│ 2. Referenced / Related Works        │
│                                      │
│ DB relationships → connected works   │
│                  → more authors      │
│                  → more topics       │
└──────────────────┬───────────────────┘
                   ↓
┌──────────────────────────────────────┐
│ 3. Authors                           │
│                                      │
│ paper_authors → OpenAlex authors     │
│               → author metadata      │
│               → author topics        │
│               → local author IDs     │
└──────────────────┬───────────────────┘
                   ↓
┌──────────────────────────────────────┐
│ 4. Topics                            │
│                                      │
│ paper + author topic IDs             │
│        → OpenAlex topics             │
│        → local topic IDs             │
└──────────────────────────────────────┘
```

The dependency is therefore not only an execution convention. Database state
created by earlier stages is actively used to determine the inputs or
relationships of later stages.

## Normalization and Transformation

The preprocessing and ingestion layers perform transformations between the
OpenAlex API representation and the application's PostgreSQL model.

### OpenAlex Identifier Normalization

OpenAlex entities may be represented as complete OpenAlex URLs or identifiers.
Shared normalization logic converts these values into the identifier form used
by the application.

The same normalization approach is also applied to lists of OpenAlex
identifiers where required.

### Abstract Reconstruction

OpenAlex abstracts are supplied as inverted indexes rather than ordinary
abstract strings.

The work preprocessing stages reconstruct these indexes into ordered plain
text before writing processed work records.

This allows the database to store directly usable abstract text and supports
the generated PostgreSQL full-text-search vector described in
[Database Design](./database.md).

### Publication-Year Validation

Work ingestion accepts papers whose publication year falls within the
configured range:

```text
1800 ≤ publication_year ≤ 2026
```

Records outside this range are skipped before database insertion.

The validation is shared by both main-work and referenced/related-work
ingestion.

### Language Normalization

Shared ingestion utilities contain language-code normalization used when
preparing work metadata for PostgreSQL.

Language codes are mapped to normalized language names before the resulting
paper data is persisted.

### Recommendation Features

Work ingestion also prepares paper-level data used by the recommendation
subsystem.

Shared ingestion utilities derive recommendation feature vectors from work
metadata and calculate scalar citation and recency features before those
features are persisted.

The recommendation algorithms that consume these values are documented
separately in
[Recommendation System](./recommendation-system.md).

## Ingestion Strategy

### JSONL Intermediate Format

Processed datasets use JSON Lines rather than one large JSON array.

Each line represents one normalized entity:

```text
{"id": "...", ...}
{"id": "...", ...}
{"id": "...", ...}
```

This allows ingestion to stream records in batches rather than loading the
entire processed dataset into memory at once.

### Database Batching

The primary ingestion scripts use batches of:

```text
5,000 records
```

Shared JSONL utilities yield one batch at a time, and each batch is processed
and committed before the next begins.

This bounds the amount of data processed in a single transaction and prevents
one long-running transaction from covering the entire dataset.

### Transaction Boundaries

Each ingestion batch is treated as a transaction boundary.

The general pattern is:

```text
Read Batch
    ↓
Transform Database Tuples
    ↓
Insert / Update Records
    ↓
Commit Batch
```

If processing fails before the current transaction is committed, the
transaction is rolled back and the error is propagated.

Previously committed batches remain persisted.

## Fetch Reliability

The fetch layer contains several mechanisms intended to make long-running
OpenAlex retrieval resumable and less sensitive to temporary request failures.

### Checkpoints

Fetch operations persist completed-batch state to files under:

```text
checkpoints/
```

A restarted fetch can therefore skip work already marked as complete.

The exact checkpoint representation differs between the main-work fetch and
the ID-batched entity fetches, but in both cases the purpose is to preserve
progress across executions.

### Cached ID Sets

The referenced/related-work, author, and topic fetch stages persist the entity
IDs selected for retrieval.

Examples include:

```text
data/raw/referenced_related_works/ids_to_fetch.json
data/raw/authors/ids_to_fetch.json
data/raw/topics/ids_to_fetch.json
```

When these files already exist, the fetch stages can reuse the previously
calculated input set rather than rebuilding it from the current database or
intermediate data.

### Request Retries

OpenAlex requests are retried when requests fail.

The fetch code also handles HTTP `429` rate-limit responses by delaying before
retrying.

The main-work fetch deliberately introduces a delay between successful
requests in addition to retry handling.

### API-Key Sanitization

The API key is required for OpenAlex requests but should not be persisted as
part of request metadata.

Before request parameters are written to raw files or included in final
request-failure messages, the shared sanitization utility replaces the
`api_key` value with:

```text
[REDACTED]
```

The real parameter dictionary is still used for the HTTP request itself.

This prevents the OpenAlex API key from being copied into generated raw
request metadata or explicit request-parameter error output.

## Logging

Pipeline stages write operational logs under:

```text
logs/
```

Logging is configured through the shared logging utility and is used to record
information such as:

- stage startup and completion,
- input and output files,
- batch progress,
- fetched record counts,
- skipped records,
- database commits,
- checkpoint behavior, and
- request or ingestion failures.

Separate log files are used for the major fetch, preprocessing, and ingestion
operations.

## Pipeline Outputs

After all four dataset groups have been processed, PostgreSQL contains the
research metadata required by the runtime application.

At a high level, the pipeline populates:

```text
Papers
├── Authorships
├── Author Affiliations
├── Paper Topics
├── Keywords
├── Locations
├── References
├── Related Works
├── Citation History
└── Recommendation Features

Authors
├── Affiliations
├── Last-Known Institutions
├── Topics
├── Topic Shares
└── Yearly Statistics

Topics
└── OpenAlex Topic Hierarchy
```

The author and topic ingestion stages additionally resolve previously stored
OpenAlex identifiers to local database identifiers, completing the
relationships between the core research entities.

For the exact tables and relationships populated by these operations, see
[Database Design](./database.md).

## Optional Synthetic Recommendation Users

The pipeline source also contains:

```text
scripts/demo_users/create_recommendation_test_users.py
```

This script is not part of the required OpenAlex dataset-construction flow.

It creates synthetic application users and interaction data for exercising the
recommendation subsystem against a populated research database.

It should therefore be treated as optional development and demonstration
support rather than as a fifth OpenAlex pipeline stage.

## Execution Summary

The complete required dataset-construction sequence is:

```text
Main Works
    fetch
      ↓
    preprocess
      ↓
    ingest
      ↓
Referenced / Related Works
    fetch
      ↓
    preprocess
      ↓
    ingest
      ↓
Authors
    fetch
      ↓
    preprocess
      ↓
    ingest
      ↓
Topics
    fetch
      ↓
    preprocess
      ↓
    ingest
```

The corresponding commands and environment setup are documented in
[Local Setup](./setup.md).

The separation between raw retrieval, preprocessing, and database ingestion
keeps external API acquisition independent from transformation and persistence,
while checkpoints, cached input sets, batch processing, and transaction
boundaries make the large dataset-construction process resumable and
incremental.