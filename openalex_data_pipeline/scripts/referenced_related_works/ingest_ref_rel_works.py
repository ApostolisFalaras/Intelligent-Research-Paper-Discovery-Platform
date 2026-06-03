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
    read_jsonl_batch,
    has_valid_publication_year,
    insert_papers,
    insert_paper_authors,
    build_remaining_tables_tuples,
    insert_remaining_tables_tuples
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

GLOBAL_JSONL_FILE = BASE_DIR / "data/processed/referenced_related_works/ref_rel_works.jsonl"
BATCH_SIZE = 5000

LOG_FILE = LOG_DIR / "ingest_openalex_ref_rel_works.log"
logger = get_logger("ingest_openalex", log_file=LOG_FILE)

def ingest() -> None:
    logger.info("Starting OpenAlex Top 100K Referenced / Related Works ingestion")
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
        total_works = 0
        
        for batch_number, batch in enumerate(tqdm(read_jsonl_batch(GLOBAL_JSONL_FILE, BATCH_SIZE), desc="Ingesting Batches"), start=1):
            total_batches += 1
            total_works += len(batch)
            
            logger.info(f"Batch {batch_number}: started with {len(batch)} works.")
            
            # Rejecting Papers whose publication year is outside the range [1800,2026]
            original_batch_size = len(batch)
            batch = [work for work in batch if has_valid_publication_year(work)]
            skipped_count = original_batch_size - len(batch)
            
            logger.info(
                f"Batch {batch_number}: started with {original_batch_size} works, "
                f"skipped_invalid_year={skipped_count}, valid={len(batch)}"   
            )
            
            if not batch:
                logger.info(f"Batch {batch_number}: no valid works, skipping...")
                continue
            
            # Insert batch of papers
            paper_ids = insert_papers(batch, cur)
            logger.info(f"Batch {batch_number}: papers inserted/updated={len(paper_ids)}")
            
            # Insert paper-author tuples for the current batch of papers
            paper_author_ids = insert_paper_authors(batch, paper_ids, cur, logger)
            logger.info(f"Batch {batch_number}: paper_authors inserted/updates={len(paper_author_ids)}")
            
            # Populate the rest of the tables for the current batch of papers
            tuple_batches = build_remaining_tables_tuples(batch, paper_ids, paper_author_ids, logger)
            logger.info(
                f"Batch {batch_number}: prepared tuples "
                f"institutions={len(tuple_batches['paper_author_institutions_rows'])}, "
                f"affiliations={len(tuple_batches['paper_author_affiliations_rows'])}, "
                f"topics={len(tuple_batches['paper_topics_rows'])}, "
                f"keywords={len(tuple_batches['paper_keywords_rows'])}, "
                f"locations={len(tuple_batches['paper_locations_rows'])}, "
                f"references={len(tuple_batches['paper_references_rows'])}, "
                f"related={len(tuple_batches['paper_related_rows'])}, "
                f"counts_by_year={len(tuple_batches['paper_counts_by_year_rows'])}"    
            )
            
            insert_remaining_tables_tuples(tuple_batches, cur)
            
            # Making sure to commit each batch before moving to the next batch
            conn.commit()
            
            logger.info(f"Batch {batch_number}: committed successfully")
            
        logger.info(f"Ingestion completed: batches={total_batches}, works={total_works}")
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