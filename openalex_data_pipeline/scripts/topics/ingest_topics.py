import json
from tqdm import tqdm
from pathlib import Path
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import cursor
from scripts.utils.logging_utils import get_logger

from scripts.ingestion.ingestion_utils import (
    normalize_openalex_id, 
    read_jsonl_batch
)

# Load DB Environmental variables
load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")


BASE_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = BASE_DIR / "logs"

GLOBAL_JSONL_FILE = BASE_DIR / "data/processed/topics/topics.jsonl"
BATCH_SIZE = 5000

LOG_FILE = LOG_DIR / "ingest_openalex_topics.log"
logger = get_logger("ingest_openalex", log_file=LOG_FILE)


# --------- INSERT AUTHORS ---------

def insert_topics(topics_batch: list[dict], cur: cursor) -> None:
    topic_rows = []
    
    for topic in topics_batch:
        topic_id = normalize_openalex_id(topic.get("id"))

        # As a safety check, I make sure all nested fields contain actual data, or otherwise use {}
        # This also applies to all tuple construction processes in the below functions
        topic_rows.append((
            topic_id,
            topic.get("display_name"),
            topic.get("description"),
            topic.get("keywords") or [],
            (topic.get("ids") or {}).get("wikipedia"),
            normalize_openalex_id((topic.get("domain") or {}).get("id")),
            (topic.get("domain") or {}).get("display_name"),
            normalize_openalex_id((topic.get("field") or {}).get("id")),
            (topic.get("field") or {}).get("display_name"),
            normalize_openalex_id((topic.get("subfield") or {}).get("id")),
            (topic.get("subfield") or {}).get("display_name"),
            topic.get("works_count"),
            topic.get("cited_by_count"),
            topic.get("works_api_url"),
            topic.get("created_date"),
            topic.get("updated_date")
        ))
        
    query = """
        INSERT INTO topics (
            openalex_id, topic_display_name, topic_description, topic_keywords,
            topic_wikipedia_url, domain_openalex_id, domain_display_name,
            field_openalex_id, field_display_name, subfield_openalex_id,
            subfield_display_name, works_count, cited_by_count,
            works_api_url, openalex_created_at, openalex_updated_at
        )
        VALUES %s
        ON CONFLICT (openalex_id) DO UPDATE SET
            topic_display_name = EXCLUDED.topic_display_name,
            topic_description = EXCLUDED.topic_description,
            topic_keywords = EXCLUDED.topic_keywords,
            topic_wikipedia_url = EXCLUDED.topic_wikipedia_url,
            domain_openalex_id = EXCLUDED.domain_openalex_id,
            domain_display_name = EXCLUDED.domain_display_name,
            field_openalex_id = EXCLUDED.field_openalex_id,
            field_display_name = EXCLUDED.field_display_name,
            subfield_openalex_id = EXCLUDED.subfield_openalex_id,
            subfield_display_name = EXCLUDED.subfield_display_name,
            works_count = EXCLUDED.works_count,
            cited_by_count = EXCLUDED.cited_by_count,
            works_api_url = EXCLUDED.works_api_url,
            openalex_updated_at = EXCLUDED.openalex_updated_at;
    """
    
    execute_values(cur, query, topic_rows)
    return len(topic_rows)

        
 
# --------- INGEST TOPICS ---------

def ingest() -> None:
    logger.info("Starting OpenAlex Topics ingestion")
    logger.info(f"Input file: {GLOBAL_JSONL_FILE}")
    logger.info(f"Batch size: {BATCH_SIZE}")
    logger.info(f"Database: host={DB_HOST}, db={DB_NAME}, user={DB_USER}")
    
    conn = None
    cur = None
    
    try:
        # Establish connection and create cursor object that executes queries
        conn = psycopg2.connect(
            dbname=DB_NAME, 
            host=DB_HOST,
            user=DB_USER, 
            password=DB_PASSWORD,
            port=DB_PORT
        )
        
        cur = conn.cursor()
        
        # Log metrics
        total_batches = 0
        total_topics = 0
        
        for batch_number, batch in enumerate(tqdm(read_jsonl_batch(GLOBAL_JSONL_FILE, BATCH_SIZE), desc="Ingesting Batches"), start=1):
            total_batches += 1
            total_topics += len(batch)
            
            logger.info(f"Batch {batch_number}: started with {len(batch)} topics.")
            
            if not batch:
                logger.info(f"Batch {batch_number}: no valid topics, skipping...")
                continue
            
            # Insert batch of papers
            inserted_count = insert_topics(batch, cur)
            logger.info(f"Batch {batch_number}: papers inserted/updated={inserted_count}")
            
            # Making sure to commit each batch before moving to the next batch
            conn.commit()
            
            logger.info(f"Batch {batch_number}: committed successfully")
            
        logger.info(f"Ingestion completed: batches={total_batches}, topics={total_topics}")
    except Exception:
        # Rolling back a failing transaction
        if conn:
            conn.rollback()
            logger.exception("Ingestion failed. Current batch transaction was rolled back")
        raise
    finally:
        # Making sure to close the cursor and connection resources 
        # regardless of the outcome's success/failure
        if cur:
            cur.close()
        if conn:
            conn.close()
            logger.info("Database connection closed")
                
    
if __name__ == "__main__":
    ingest()