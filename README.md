# 🧠 Intelligent Research Paper Discovery Platform

## 📌 Overview
A full-stack web application for discovering and ranking research papers.

## 🧩 Tech Stack
- React
- Node.js
- PostgreSQL

```
project-root/
│
├── client/        # React frontend (UI, components, pages, styling)
├── server/        # Express backend (API routes, controllers, business logic)
├── database/      # Database schema, migrations, and seed data
├── scripts/       # Utility scripts (data import, preprocessing, maintenance tasks)
├── docs/          # Project documentation (architecture, API specs, notes)
├── README.md      # Project overview, setup instructions, and milestones
└── .gitignore     # Files and folders ignored by Git
```

## 📊 Status
🚧 Currently in active development

In `fetch_works.py`:

I choose to extract a subset of [OpenAlex](https://developers.openalex.org/api-reference/introduction), consisting of 1M papers across the top 100 most popular (in terms of total number of papers) topics.

However, to balance older papers, which are usually more cited, and newer papers, which keep the dataset up with more recent scientific developments, I chose the classify the papers in 3 retrieval types/buckets for each topic:
- 70% of papers are the most cited papers a topic.
- 20% of papers are the most recent papers in a topic.
- 10% of papers are a combination og the most cited and recent (after 2020) papers in topic.

In addition, having to account for the 10000 free daily Sort/Filter List OpenAlex API calls, I performed 100 API calls for each topic, and each one of those calls fetched 100 (maximum number allowed) papers.

In `preprocess_works.py`:

I pre-processed the fetched Works tuple in the following steps:
1. I normalized each tuple so that it contains metadata information regarding the topic it belongs in, the category (bucket) it was fetched for, its batch number, request and response metadata parameters. This way each tuple is self-contained and allows for easier tracing and debugging.
2. For each topic, I created a unified `.jsonl` file that stores the normalized tuples for a particular topic from all its tuple buckets, and deduplicated the topic tuples during insertion.
3. Finally, I created a global `.jsonl` file for all tuples of all topics, including a final deduplication step, since it's very possible that papers from one topic also belong in other topic categories.

In `ingest_works.py`:

I access all the works tuples from the global `.jsonl` file and construct tuples that match the database schema. Then, I construct the insertion queries that ingest the tuples in the actual PostgreSQL tables.

To speed up the ingestion process and reduce the database queries' performance overhead, I inserted works tuples in batches of `5000`. Each works batch was also used to insert data in the rest of the tables from the schema, and not just the `papers` table.


## 🎯 Planned Milestones

### 🏗️ Architecture & Setup
- [x] Project initialization (frontend + backend)
- [x] Database schema design (PostgreSQL)
- [x] Backend architecture (routes, controllers, services)
- [x] Frontend component structure

### 📈 Dataset Preparation
- [x] Dataset selection (Subset of OpenAlex)
- [x] Dataset exploration & retrieval
- [x] Data preprocessing (cleaning, normalization)
- [x] Data mapping to DB schema
- [x] Data insertion scripts (ETL)

### ⚙️ Core Features
- [ ] Backend API setup
- [ ] Frontend UI implementation
- [ ] Search functionality (basic keyword search)
- [ ] Advanced filtering (year, authors, topics)

### 🧠 Algorithms & Intelligence
- [ ] Full-text search integration (`tsvector`)
- [ ] Ranking engine (TF-IDF + scoring)
- [ ] Recommendation system (content-based)
- [ ] Collaborative filtering (advanced)
- [ ] Graph traversal (BFS/DFS for citations)

### 🚀 Performance & Scalability
- [ ] Query optimization
- [ ] Caching layer (Redis)
- [ ] Search optimization (indexing / Elasticsearch)

### 🌐 Production & Deployment
- [ ] Environment configuration
- [ ] Deployment (VPS / cloud)
- [ ] CI/CD pipeline setup *(Optional)*
- [ ] Logging & error handling

### 📊 UX & Visualization
- [ ] Responsive UI design
- [ ] Search results ranking visualization
- [ ] Graph-based exploration UI
- [ ] Loading states & error feedback

### 🧪 Testing & Quality
- [ ] Backend testing (API endpoints)
- [ ] Frontend testing
- [ ] Integration testing

