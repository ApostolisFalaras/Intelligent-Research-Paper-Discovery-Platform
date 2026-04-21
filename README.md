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

Exploring solutions for extracting a representative small subset of ![OpenAlex](https://developers.openalex.org/api-reference/introduction) using its API..

A potential schema expansion will be introduced due to OpenAlex's rich datasets

## 🎯 Planned Milestones

### 🏗️ Architecture & Setup
- [x] Project initialization (frontend + backend)
- [x] Database schema design (PostgreSQL)
- [x] Backend architecture (routes, controllers, services)
- [x] Frontend component structure

### 📈 Dataset Preparation
- [x] Dataset selection (Subset of OpenAlex)
- [ ] Dataset exploration
- [ ] Data preprocessing (cleaning, normalization)
- [ ] Data mapping to DB schema
- [ ] Data insertion scripts (ETL)

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

