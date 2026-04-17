# Architecture Overview

## Components
- Frontend Client (React)

- Backend Server (Node.js + Express.js)
  - Routes define endpoints
  - Controllers handle requests and responses
  - Services handle core business logic and DB interactions.

- Database (PostgreSQL)

## Primary Data Flow
1. User submits search query
2. Backend processes query
3. Database returns results
4. Ranking engine sorts results.
5. Results sent to frontend