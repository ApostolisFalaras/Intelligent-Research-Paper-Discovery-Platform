# Recommendation System

This document describes the recommendation subsystem used by the research paper
discovery platform, including interaction collection, user-profile generation,
user similarity, candidate generation, recommendation scoring, caching,
cold-start behavior, and background refresh processing.

For the PostgreSQL tables that support recommendation processing, see [Database Design](./database.md). For the recommendation subsystem's place in the overall application, see [System Architecture](./architecture.md).

## Overview

The application uses a hybrid recommendation system that combines multiple
sources of evidence rather than relying on a single recommendation strategy.

The main recommendation signals are:

- content similarity between a user's interests and paper features,
- behavior from users with similar interests,
- topic relevance,
- global paper popularity, and
- publication recency.

At a high level:

```text
User Interactions
       ↓
User Preference Profile
       ↓
User Similarity Cache
       ↓
Candidate Generation
       ↓
┌─────────────────────────────┐
│ Content-Based Scoring       │
│ Collaborative Scoring       │
│ Topic Scoring               │
│ Popularity Scoring          │
│ Recency Scoring             │
└─────────────────────────────┘
       ↓
Hybrid Scoring
       ↓
Top 100 Recommendations
       ↓
Recommendation Cache
       ↓
Recommendation API
```

Recommendation computation is separated from recommendation delivery.
Personalized recommendations are generated in the background and persisted in
PostgreSQL so normal API requests can retrieve cached results without
recomputing the complete recommendation pipeline.

## Recommendation Components

The backend separates recommendation behavior across algorithms, services,
repositories, and background processing.

At a high level:

```text
server/src/
├── algorithms/
│   ├── collaborativeFiltering.js
│   ├── contentBasedRecommendations.js
│   ├── hybridRecommendationScoring.js
│   ├── popularityScoring.js
│   ├── topicRecommendations.js
│   ├── userProfileAggregation.js
│   └── userSimilarity.js
│
├── services/
│   ├── popularityService.js
│   ├── recommendationCacheService.js
│   ├── recommendationEventService.js
│   ├── recommendationJobService.js
│   ├── recommendationProfileService.js
│   ├── recommendationService.js
│   └── recommendationSimilarityService.js
│
├── repositories/
│   ├── popularityRefreshRepository.js
│   ├── popularityRepository.js
│   ├── recommendationCacheRepository.js
│   ├── recommendationCandidateRepository.js
│   ├── recommendationEventRepository.js
│   ├── recommendationProfileRepository.js
│   ├── recommendationRefreshRepository.js
│   ├── recommendationRepository.js
│   └── recommendationSimilarityRepository.js
│
└── jobs/
    └── backgroundRefreshJob.js
```

The algorithm modules contain the recommendation and scoring calculations.
Services coordinate recommendation workflows, repositories encapsulate the
underlying PostgreSQL queries, and the background job schedules asynchronous
popularity and personalized-recommendation refreshes.

## Recommendation Data

The subsystem uses several persistent data structures.

```text
user_paper_interactions
        ↓
user_profile_preferences
        ↓
user_similarity_cache
        ↓
user_recommendation_cache
```

Supporting paper-level data is stored in:

```text
paper_recommendation_features
paper_metrics
```

Refresh state is stored in:

```text
recommendation_refresh_queue
popularity_refresh_state
```

### Paper Recommendation Features

`paper_recommendation_features` contains precomputed information required by
recommendation algorithms.

Each paper can contain sparse feature vectors for:

- topics,
- domains,
- fields,
- subfields,
- authors, and
- keywords.

It also contains scalar:

- citation score, and
- recency score.

These features are constructed during research-data ingestion rather than
being reconstructed from the complete research metadata every time
recommendations are generated.

### User Interaction State

`user_paper_interactions` represents the interaction history between an
individual user and a paper.

The recommendation system uses:

- paper views,
- whether the paper is currently saved,
- the number of folders in which the paper is saved, and
- interaction recency.

Folder membership is queried separately when profiles and collaborative
signals are constructed so that saving a paper in multiple folders can act as
a stronger signal than a single save.

### Global Paper Metrics

`paper_metrics` stores application-wide behavioral information for papers:

- view count,
- save count,
- recommendation click count, and
- global popularity score.

These metrics are separate from per-user interaction history.

## Interaction Processing

Recommendation processing begins with user activity.

The event service handles four recommendation-related events:

```text
Paper View
Paper Save
Paper Unsave
Recommendation Click
```

Different events affect different pieces of state.

### Paper Views

A recorded paper view:

1. updates the user's paper-interaction state,
2. increments the paper's global view count,
3. marks global popularity as requiring refresh, and
4. marks the user's recommendations as stale.

A view requests a personalized recommendation refresh with priority:

```text
1
```

Duplicate view handling prevents the same frontend view event from
incorrectly incrementing the global view metric more than once when the
interaction repository reports that no new view was recorded.

### Paper Saves

A successful paper save:

1. updates the user's saved interaction state,
2. increments the paper's global save count,
3. marks popularity as requiring refresh, and
4. marks the user's recommendations as stale.

Save events use refresh priority:

```text
3
```

### Paper Unsaves

A successful unsave performs the corresponding inverse update:

1. the user's saved interaction state is updated,
2. the global save count is decremented,
3. popularity is marked as requiring refresh, and
4. personalized recommendations are marked stale.

Unsave events also use priority:

```text
3
```

### Recommendation Clicks

Clicking a paper presented as a recommendation:

1. increments its global recommendation-click count,
2. marks popularity as requiring refresh, and
3. marks the user's personalized recommendations as stale.

Recommendation-click events use priority:

```text
2
```

The event does not independently create the same view/save interaction state
used by those corresponding actions.

## User Preference Profiles

Personalized recommendation generation begins by converting a user's
interaction history into a compact preference profile.

The resulting profile is persisted in:

```text
user_profile_preferences
```

and contains normalized preference vectors for:

```text
Topics
Domains
Fields
Subfields
Authors
Keywords
```

## Interaction Weighting

For every interacted paper, the system calculates an interaction weight from
its number of views and folder saves.

The view component is:

```text
viewWeight = log(1 + viewCount)
```

The folder-save component is:

```text
saveWeight = 0
```

when the paper is not saved in any folder, otherwise:

```text
saveWeight = 5 + 2 × log(1 + savedFolderCount)
```

The complete interaction weight is:

```text
interactionWeight = viewWeight + saveWeight
```

This makes saves substantially stronger signals than ordinary views while
using logarithmic growth to reduce the effect of repeatedly viewing or saving
the same paper.

## Feature Aggregation

For each interacted paper, its feature vectors are multiplied by the
interaction weight and accumulated into the corresponding user preference
vectors.

Conceptually:

```text
User Topic Preference
    +=
Paper Topic Vector × Interaction Weight
```

The same operation is performed for:

```text
topic
domain
field
subfield
author
keyword
```

After aggregation, the system keeps only the strongest entries in each
feature space:

| Preference | Maximum Entries |
| ---------- | --------------: |
| Topics | 50 |
| Domains | 20 |
| Fields | 30 |
| Subfields | 50 |
| Authors | 100 |
| Keywords | 100 |

Each trimmed vector is then normalized so that its values sum to approximately
one.

The resulting vectors form the user's current research-interest profile.

## User Similarity

Collaborative recommendation processing compares a user's preference profile
with the profiles of other users.

Similarity is calculated independently across the six preference spaces using
cosine similarity.

For users \(A\) and \(B\):

```text
topicSimilarity
domainSimilarity
fieldSimilarity
subfieldSimilarity
authorSimilarity
keywordSimilarity
```

are combined as:

```text
userSimilarity =
    0.35 × topicSimilarity
  + 0.25 × subfieldSimilarity
  + 0.15 × fieldSimilarity
  + 0.05 × domainSimilarity
  + 0.10 × authorSimilarity
  + 0.10 × keywordSimilarity
```

The strongest emphasis is therefore placed on topic and subfield overlap,
while author and keyword overlap provide additional research-interest
signals.

Similarity scores less than or equal to zero are discarded.

The remaining users are ordered by similarity and the top:

```text
50 users
```

are stored in:

```text
user_similarity_cache
```

Replacing the similarity cache is performed transactionally: the previous
entries for the user are deleted and the new similarity set is inserted
within the same transaction.

## Candidate Generation

Recommendation scoring is not performed against every paper in the database.

Instead, a candidate pool is assembled from several retrieval strategies based
on the user's current profile and recommendation state.

The user's strongest profile entries are first extracted:

```text
Top 5 topic preferences
Top 10 subfield preferences
```

Candidate papers are then collected from multiple sources.

### Topic Candidates

Up to:

```text
3,000 papers
```

are retrieved from papers associated with the user's five strongest topic
preferences.

### Subfield Candidates

Up to:

```text
1,500 papers
```

are retrieved from papers associated with the user's ten strongest subfield
preferences.

### Popular Candidates

Up to:

```text
1,000 papers
```

are selected according to global popularity score, with citation score used
as an additional ordering criterion.

### Recent Candidates

Up to:

```text
1,000 papers
```

are selected according to their precomputed recency score.

### Collaborative Candidates

Up to:

```text
5,000 interaction rows
```

are retrieved from users stored in the current user's similarity cache.

These rows are ordered primarily by user similarity and then by interaction
recency.

## Interaction Exclusion

Papers the current user has already interacted with are excluded from the
personalized candidate set.

The exclusion set is derived from:

```text
user_paper_interactions
```

This prevents previously viewed or saved papers from being returned as new
personalized recommendations.

After candidates from all sources are combined, paper IDs are deduplicated
before their complete recommendation features are fetched.

## Content-Based Scoring

Content-based scoring compares the user's preference vectors with a candidate
paper's feature vectors.

Cosine similarity is calculated independently for:

```text
Topics
Subfields
Fields
Domains
Authors
Keywords
```

The final content score is:

```text
contentScore =
    0.35 × topicSimilarity
  + 0.20 × subfieldSimilarity
  + 0.15 × fieldSimilarity
  + 0.10 × domainSimilarity
  + 0.10 × authorSimilarity
  + 0.10 × keywordSimilarity
```

Candidate papers with a content score less than or equal to zero are discarded
from the content-based recommendation result.

The remaining papers are ordered by descending content score.

## Collaborative Filtering

Collaborative filtering scores papers based on interactions performed by
similar users.

For each interaction from a similar user, the system calculates the same
view/save weighting structure used for user-profile generation:

```text
viewWeight = log(1 + viewCount)
```

and, when saved:

```text
saveWeight = 5 + 2 × log(1 + savedFolderCount)
```

The interaction weight is:

```text
interactionWeight = viewWeight + saveWeight
```

The contribution of that similar user's interaction is then:

```text
contribution = similarityScore × log(1 + interactionWeight)
```

Contributions from multiple similar users for the same paper are summed.

The resulting collaborative scores are min-max normalized to:

```text
[0, 1]
```

Scores less than or equal to zero are removed and the remaining papers are
ordered by descending collaborative score.

## Topic Scoring

Topic scoring provides a more focused topical-relevance signal than the
general content score.

It compares only:

- topics,
- fields, and
- subfields.

For each candidate paper:

```text
topicScore = 0.60 × topicSimilarity + 0.30 × fieldSimilarity + 0.10 × subfieldSimilarity
```

Scores less than or equal to zero are discarded.

### Topic Ranking

The recommendation subsystem also ranks research topics for a user separately
from the topic-relevance score assigned to candidate papers.

Candidate topics are restricted to topics represented in the user's
topic-preference vector. Each topic combines the user's preference strength
with a popularity signal derived from the topic's work and citation counts.

Topic popularity is calculated from:

```text
worksCount + citedByCount
```

and normalized across the candidate topics.

The final topic-ranking score is:

```text
topicRankingScore = 0.80 × userPreferenceScore + 0.20 × normalizedTopicPopularity
```

Topics are sorted by this score and the highest-ranked topics are returned.

## Popularity Scoring

Global popularity is calculated separately from personalized recommendation
generation.

The popularity calculation uses five normalized paper-level signals:

```text
Views
Saves
Recommendation Clicks
Citation Score
Recency Score
```

Each signal is min-max normalized using the current minimum and maximum values
across the paper dataset.

The global popularity score is:

```text
popularityScore =
    0.30 × saveScore
  + 0.20 × viewScore
  + 0.15 × recommendationClickScore
  + 0.25 × citationScore
  + 0.10 × recencyScore
```

The resulting score is persisted in:

```text
paper_metrics.popularity_score
```

and can then be reused both for general popular-paper recommendations and as a
signal in personalized hybrid scoring.

## Recency Scoring

Recency is represented by the precomputed:

```text
paper_recommendation_features.recency_score
```

The recommendation subsystem does not recalculate publication recency for each
recommendation request.

Instead, the stored score is retrieved together with the candidate paper's
other recommendation features and used directly by hybrid scoring.

## Hybrid Recommendation Scoring

The final personalized score combines the five recommendation signals.

For each candidate paper:

```text
finalScore =
    0.45 × contentScore
  + 0.25 × collaborativeScore
  + 0.15 × topicScore
  + 0.10 × popularityScore
  + 0.05 × recencyScore
```

Content relevance therefore has the largest influence, followed by
collaborative evidence and topical relevance.

Popularity and recency provide smaller global signals.

Papers whose final score is less than or equal to zero are removed, and the
remaining papers are sorted in descending final-score order.

The first:

```text
100 papers
```

are persisted as the user's current recommendation cache.

## Recommendation Reasons

Each cached recommendation receives a reason based on the strongest individual
recommendation signal.

The mappings are:

| Dominant Signal | Stored Reason |
| --- | --- |
| Content score | `because_of_your_interests` |
| Collaborative score | `users_like_you_read` |
| Topic score | `popular_in_your_topics` |
| Popularity score | `popular_papers` |
| Recency score | `recent_relevant_papers` |

If none of the component scores is positive, the fallback reason is:

```text
general_recommendation
```

The reason is stored together with the component and final scores in
`user_recommendation_cache`.

## Recommendation Cache

The final cache contains, for each user-paper recommendation:

```text
final_score
content_score
collaborative_score
topic_score
popularity_score
recency_score
reason
updated_at
```

When a cache is rebuilt, the previous recommendation set is replaced
transactionally.

Conceptually:

```text
BEGIN
   ↓
Delete Previous User Cache
   ↓
Insert New Top Recommendations
   ↓
COMMIT
```

If replacement fails, the transaction is rolled back so the cache is not left
partially replaced.

## Recommendation Delivery

The recommendation API uses cached recommendation data to construct the
different recommendation views presented by the frontend.

The backend supports recommendation delivery for both authenticated and
unauthenticated users.

### Unauthenticated Users

Users without an authenticated session receive popular-paper recommendations.

The homepage returns:

```text
10 popular papers
```

and the full recommendations page exposes only:

```text
popular
```

as an available recommendation type.

### Authenticated Cold Start

An authenticated user with no recorded paper interactions also receives
popular recommendations.

This avoids requiring a personalized profile before the application can
provide useful discovery results.

## Progressive Personalization

The recommendation interface changes as the number of recorded paper
interactions increases.

### No Interactions

```text
Available:
- Popular
```

### 1–2 Interactions

```text
Available:
- Activity / content-based
- Popular
```

On the homepage, the activity section is presented as:

```text
Because you viewed
```

### 3–9 Interactions

```text
Available:
- Activity / content-based
- Topics
- Popular
```

The homepage presents these as:

```text
Based on your interests
Explore your research topics
Popular papers
```

### 10 or More Interactions

```text
Available:
- Activity / content-based
- Similar users
- Topics
```

The homepage presents:

```text
Based on your interests
Researchers with similar interests also viewed
Explore your research topics
```

This progressively introduces more personalized recommendation categories as
additional behavioral information becomes available.

If an authenticated user has interactions but the personalized recommendation
queries return no results, the homepage falls back to popular papers.

## Recommendation Retrieval Types

Personalized recommendation delivery reads different component scores from the
same cached recommendation set.

The application exposes the conceptual categories:

```text
activity
similar
topics
popular
```

`activity` recommendations are derived from cached content-based relevance.

`similar` recommendations represent collaborative recommendations based on
similar-user behavior.

`topics` recommendations represent topical relevance.

`popular` recommendations are global and do not require a personalized cache.

The recommendations page limits the visible recommendation collection to at
most:

```text
100 papers
```

for each selected recommendation mode.

## Refresh Queue

Personalized recommendation generation is asynchronous.

Relevant interactions mark a user's recommendation state as stale in:

```text
recommendation_refresh_queue
```

A stale request contains:

- user ID,
- refresh reason,
- priority,
- request timestamp, and
- processing state.

When another unprocessed refresh already exists for the user, the stale state
is updated rather than requiring independent processing of every interaction.

The stored priority becomes the greater of the existing and new priority.

Pending users are processed by:

1. highest refresh priority, then
2. oldest pending request.

## Personalized Refresh Workflow

For each stale user, the background recommendation workflow executes:

```text
Rebuild User Preference Profile
       ↓
Rebuild User Similarity Cache
       ↓
Rebuild User Recommendation Cache
       ↓
Mark Refresh as Processed
```

In service terms:

```text
rebuildUserProfilePreferences()
       ↓
rebuildUserSimilarityCache()
       ↓
rebuildUserRecommendationCache()
       ↓
markUserRecommendationsProcessed()
```

A failure for one user does not terminate processing for the remaining stale
users. Each user's result is recorded as either successful or failed for that
background execution.

A failed user's pending refresh is not marked as processed.

The scheduled worker processes at most:

```text
50 stale users
```

per personalized-refresh execution.

## Global Popularity Refresh

Global popularity has a separate refresh lifecycle from personalized
recommendations.

Each successful popularity-affecting interaction increments the pending event
state stored in:

```text
popularity_refresh_state
```

Popularity is rebuilt when there are pending events and either:

```text
pending events ≥ 500
```

or no new popularity-affecting event has occurred for at least:

```text
15 minutes
```

If neither condition has been reached, the current popularity scores remain in
place.

## Popularity Rebuild

When a global popularity refresh is required, the service first determines the
minimum and maximum values required to normalize the popularity metrics.

It then processes papers in batches of:

```text
10,000 papers
```

For every batch:

```text
Paper Metrics + Recommendation Features
       ↓
Normalize Popularity Inputs
       ↓
Calculate Popularity Scores
       ↓
Update paper_metrics
```

After the rebuild completes, the processed popularity-event state is marked as
refreshed.

## Scheduled Background Processing

The backend starts the recommendation background job when the server starts
outside the test environment.

The job is scheduled using `node-cron` and runs every:

```text
30 minutes
```

Each scheduled execution first checks whether global popularity requires a
refresh.

Personalized stale-user processing occurs on every second scheduled
execution, effectively giving it a:

```text
60-minute cadence
```

while the server remains running.

The order is intentional:

```text
Scheduled Tick
      ↓
Check / Refresh Global Popularity
      ↓
Every Second Tick?
   ┌──┴──┐
   │ Yes │
   ↓     │
Refresh Stale
User Recommendations
```

Popularity is checked first because personalized candidate selection and
scoring use global popularity data.

If the popularity-refresh operation throws an error, personalized
recommendation rebuilding for that scheduled execution is skipped.

The worker also prevents a new scheduled execution from starting while the
previous execution is still active.

## End-to-End Personalized Recommendation Flow

The complete personalized lifecycle is:

```text
User Interacts with Paper
          ↓
Update User Interaction State
          ↓
Update Global Paper Metrics
          ↓
┌─────────────────────────────┐
│ Mark Recommendations Stale  │
│ Mark Popularity Dirty       │
└─────────────────────────────┘
          ↓
Scheduled Background Processing
          ↓
Rebuild User Preference Profile
          ↓
Rebuild User Similarity Cache
          ↓
Generate Candidate Pool
          ↓
Exclude Previously Interacted Papers
          ↓
┌─────────────────────────────┐
│ Content Score               │
│ Collaborative Score         │
│ Topic Score                 │
│ Popularity Score            │
│ Recency Score               │
└─────────────────────────────┘
          ↓
Calculate Hybrid Score
          ↓
Rank Candidates
          ↓
Keep Top 100
          ↓
Replace User Recommendation Cache
          ↓
Recommendation API
          ↓
Frontend
```

## Design Characteristics

The implemented recommendation architecture has several important
characteristics.

### Hybrid Rather Than Single-Strategy

No individual algorithm determines the final ranking.

Content, collaborative, topical, popularity, and recency signals contribute
separately to the final score.

### Precomputed Features

Paper feature vectors and scalar recommendation features are generated ahead
of recommendation requests.

This avoids repeatedly reconstructing recommendation features from normalized
research metadata.

### Cached Personalized Results

The expensive personalized pipeline is executed outside normal recommendation retrieval.

API requests primarily read already computed results.

### Explicit Cold Start

The application does not require interaction history before it can provide
recommendations.

Popular papers provide the initial discovery strategy until enough behavioral
data exists for progressively richer personalization.

### Interaction Exclusion

Previously interacted papers are removed from the personalized candidate pool,
allowing the recommendation cache to focus on undiscovered papers.

### Bounded Computation

Candidate retrieval limits, top-N preference vectors, a 50-user similarity
cache, a 100-paper recommendation cache, batched popularity processing, and
bounded stale-user processing prevent recommendation computation from
operating over every possible user-paper pair.

### Asynchronous Refresh

User interactions request recommendation updates rather than synchronously
rebuilding recommendations during the HTTP request.

This separates interaction latency from recommendation computation and allows
multiple changes to be handled through persisted refresh state.

## Related Documentation

For the persistent recommendation tables and their constraints, see
[Database Design](./database.md).

For the OpenAlex pipeline that constructs paper recommendation features, see
[OpenAlex Data Pipeline](./data-pipeline.md).

For the recommendation subsystem's relationship to the rest of the application, see [System Architecture](./architecture.md).