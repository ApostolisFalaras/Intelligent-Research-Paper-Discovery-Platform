# Local Setup

This guide describes how to configure and run the application locally from a
fresh clone of the repository.

The application consists of:

- a PostgreSQL database,
- a Python data pipeline for retrieving and ingesting OpenAlex data,
- a Node.js/Express backend, and
- a React/Vite frontend.

## Prerequisites

Install the following before setting up the project:

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) and npm
- [Python](https://www.python.org/downloads/) and pip
- [PostgreSQL](https://www.postgresql.org/download/) and psql
- [OpenAlex API key](https://docs.openalex.org/how-to-use-the-api/api-overview)

### Tested Environment

The project has been developed and tested with the following environment:

| Tool | Version |
| ---- | ------- |
| Node.js | 24.14.0 |
| Python | 3.13.1 |
| PostgreSQL | 15.4 |

Other versions may work but have not been explicitly verified.

## Clone the Repository

Clone the repository and enter the project directory:

```bash
git clone https://github.com/ApostolisFalaras/Intelligent-Research-Paper-Discovery-Platform
cd Intelligent-Research-Paper-Discovery-Platform
```

## Database Setup

Create a PostgreSQL database for the application:

```bash
psql -U postgres -d postgres -c "CREATE DATABASE research_platform;"
```

Initialize the database schema from the repository root:

```bash
psql -v ON_ERROR_STOP=1 -U postgres -d research_platform -f database/schema.sql
```

> The `user_sessions` session store table is created automatically by the backend when required
> and is therefore not part of `database/schema.sql`.

## OpenAlex Data Pipeline

The data pipeline retrieves research metadata from OpenAlex, preprocesses the responses,
and ingests the resulting records into PostgreSQL.

Enter the pipeline directory:

```bash
cd openalex_data_pipeline
```

Create a local environment file from the provided template:

```bash
cp .env.example .env
```

Configure the values in `.env`:

```env
OPENALEX_API_KEY=your_openalex_api_key

DB_HOST=localhost
DB_PORT=5432
DB_NAME=research_platform
DB_USER=postgres
DB_PASSWORD=your_postgres_password
```

### Install Pipeline Dependencies

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it:

**Windows (Git Bash):** 

```bash 
source .venv/Scripts/activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install the dependencies:
```bash
python -m pip install -r requirements.txt
```

### Populate the Database

Run the pipeline stages in the following order.

> **Note:** The full data pipeline retrieves and processes a substantial OpenAlex
> dataset. Completing all stages may require significant execution time, network
> usage, and local database storage.

#### 1. Main Works

```bash
python -m scripts.main_works.fetch_works
python -m scripts.main_works.preprocess_works
python -m scripts.main_works.ingest_works
```

#### 2. Referenced and Related Works

```bash
python -m scripts.referenced_related_works.fetch_ref_rel_works
python -m scripts.referenced_related_works.preprocess_ref_rel_works
python -m scripts.referenced_related_works.ingest_ref_rel_works
```

#### 3. Authors

```bash
python -m scripts.authors.fetch_authors
python -m scripts.authors.preprocess_authors
python -m scripts.authors.ingest_authors
```

#### 4. Topics

```bash
python -m scripts.topics.fetch_topics
python -m scripts.topics.preprocess_topics
python -m scripts.topics.ingest_topics
```

The stages are order-dependent. Complete each fetch → preprocess → ingest 
sequence before proceeding to the next dataset.

## Backend Setup

From the repository root:

```bash
cd server
```

Create the backend environment file:

```bash
cp .env.example .env
```

Configure the values in `.env`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=research_platform
DB_USER=postgres
DB_PASSWORD=your_postgres_password

SESSION_SECRET=replace_with_a_random_secret
```

Install the Node.js dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

By default, the backend runs on: `http://localhost:3000`

## Frontend Setup

In a second terminal, enter the client directory:

```bash
cd client
```

Install the dependencies:

```bash
npm ci
```

Start the Vite development server:

```bash
npm run dev
```

By default, the frontend runs on: `http://localhost:5173`

During local development, Vite proxies `/api` and `/uploads` requests to the
backend running on port 3000.

## Verification

### Backend Tests

From the `server/` directory:

```bash
npm test
```

### Frontend Checks

From the `client/` directory:

```bash
npm run lint
npm run test:run
npm run build
```

## Development Commands

| Component | Command | Purpose |
| --------- | ------- | ------- |
| Backend | `npm run dev` | Start Express with automatic restart |
| Backend | `npm test` | Run backend tests |
| Frontend | `npm run dev` | Start Vite development server |
| Frontend | `npm run lint` | Run ESLint |
| Frontend | `npm run test:run` | Run frontend tests once |
| Frontend | `npm run build` | Create the production build |