import json
from tqdm import tqdm
from pathlib import Path
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import cursor
from scripts.utils.logging_utils import get_logger
from typing import Generator

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

AUTHORS_JSONL_FILE = BASE_DIR / "data/processed/authors/authors.jsonl"
BATCH_SIZE = 5000

LOG_FILE = LOG_DIR / "ingest_openalex_authors.log"
logger = get_logger(name="ingest_openalex", log_file=LOG_FILE)


# --------- INSERT AUTHORS ---------

def insert_authors(authors_batch: list[dict], cur: cursor) -> dict:
    author_rows = []
    
    for author in authors_batch:
        author_id = normalize_openalex_id(author.get("id"))

        # As a safety check, I make sure all nested fields contain actual data, or otherwise use {}
        # This also applies to all tuple construction processes in the below functions
        author_rows.append((
            author_id,
            author.get("orcid"),
            author.get("display_name"),
            author.get("raw_author_names") or [],
            author.get("full_name"),
            author.get("works_count"),
            author.get("cited_by_count"),
            (author.get("summary_stats") or {}).get("2yr_mean_citedness"),
            (author.get("summary_stats") or {}).get("h_index"),
            (author.get("summary_stats") or {}).get("i10_index"),
            author.get("works_api_url"),
            author.get("created_date"),
            author.get("updated_date"),
        ))
        
    
    query = """
        INSERT INTO authors (
            openalex_id, orcid, display_name, raw_author_names, full_name,
            works_count, cited_by_count, two_year_mean_citedness, h_index, i10_index,
            works_api_url, openalex_created_at, openalex_updated_at
        )
        VALUES %s
        ON CONFLICT (openalex_id) DO UPDATE SET
            orcid = EXCLUDED.orcid,
            display_name = EXCLUDED.display_name,
            raw_author_names = EXCLUDED.raw_author_names,
            full_name = EXCLUDED.full_name,
            works_count = EXCLUDED.works_count,
            cited_by_count = EXCLUDED.cited_by_count,
            two_year_mean_citedness = EXCLUDED.two_year_mean_citedness,
            h_index = EXCLUDED.h_index,
            i10_index = EXCLUDED.i10_index,
            works_api_url = EXCLUDED.works_api_url,
            openalex_updated_at = EXCLUDED.openalex_updated_at
        RETURNING openalex_id, id;
    """
    
    results = execute_values(cur, query, author_rows, fetch=True)
    return dict(results)


# ---------- BUILD REMAINING AUTHOR-RELATED TABLE TUPLES ----------

def build_remaining_tables_tuples(authors_batch: list[dict], author_ids: dict) -> dict:
    tuple_batches = {
        "author_affiliations": {},
        "author_last_known_institutions": {},
        "author_topics": {},
        "author_topic_share": {},
        "author_counts_by_year": {}
    }    
    
    for author in authors_batch or []:
        author_openalex_id = normalize_openalex_id(author.get("id"))
        author_id = author_ids.get(author_openalex_id)
        
        if not author_id:
            logger.warning(f"Missing author_id for {author_openalex_id} while inserting author-related relations")
            continue
        
        # Setting up author_affiliations tuples
        for affiliation in author.get("affiliations") or []:
            aff_institution = affiliation.get("institution")
            
            if not aff_institution or not aff_institution.get("id"):
                logger.warning(f"Missing institution for {author_openalex_id} affiliations.")
                continue
            
            key = (author_id, aff_institution.get("id"))
            
            if key not in tuple_batches["author_affiliations"]:
                tuple_batches["author_affiliations"][key] = (
                    author_id,
                    normalize_openalex_id(aff_institution.get("id")),
                    aff_institution.get("ror"),
                    aff_institution.get("display_name"),
                    aff_institution.get("country_code"),
                    aff_institution.get("type"),
                    aff_institution.get("lineage"),
                    affiliation.get("years")
                )
                
        # Setting up author_last_known_institutions tuples
        for institution in author.get("last_known_institutions") or []:
            if not institution or not institution.get("id"):
                logger.warning(f"Missing institution for {author_openalex_id} last known institutions.")
                continue
            
            key = (author_id, institution.get("id"))
            
            if key not in tuple_batches["author_last_known_institutions"]:
                tuple_batches["author_last_known_institutions"][key] = (
                    author_id,
                    normalize_openalex_id(institution.get("id")),
                    institution.get("ror"),
                    institution.get("display_name"),
                    institution.get("country_code"),
                    institution.get("type"),
                    institution.get("lineage")
                )
        
        # Setting up author_topics tuples
        for topic in author.get("topics") or []:
            if not topic or not topic.get("id"):
                logger.warning(f"Missing topic for {author_openalex_id} topics.")
                continue
            
            key = (author_id, topic.get("id"))
            
            if key not in tuple_batches["author_topics"]:
                tuple_batches["author_topics"][key] = (
                    author_id,
                    normalize_openalex_id(topic.get("id")),
                    topic.get("display_name"),
                    topic.get("count"),
                    normalize_openalex_id((topic.get("domain") or {}).get("id")),
                    (topic.get("domain") or {}).get("display_name"),
                    normalize_openalex_id((topic.get("field") or {}).get("id")),
                    (topic.get("field") or {}).get("display_name"),
                    normalize_openalex_id((topic.get("subfield") or {}).get("id")),
                    (topic.get("subfield") or {}).get("display_name"),
                )
                
        # Setting up author_topic_share tuples
        for topic_share in author.get("topic_share") or []:
            if not topic_share or not topic_share.get("id"):
                logger.warning(f"Missing topic share for {author_openalex_id} topic share.")
                continue
            
            key = (author_id, topic_share.get("id"))
            
            if key not in tuple_batches["author_topic_share"]:
                tuple_batches["author_topic_share"][key] = (
                    author_id,
                    normalize_openalex_id(topic_share.get("id")),
                    topic_share.get("display_name"),
                    topic_share.get("value"),
                    normalize_openalex_id((topic_share.get("domain") or {}).get("id")),
                    (topic_share.get("domain") or {}).get("display_name"),
                    normalize_openalex_id((topic_share.get("field") or {}).get("id")),
                    (topic_share.get("field") or {}).get("display_name"),
                    normalize_openalex_id((topic_share.get("subfield") or {}).get("id")),
                    (topic_share.get("subfield") or {}).get("display_name")
                )
                
        # Setting up author_counts_by_year tuples
        for count in author.get("counts_by_year") or []:
            if not count:
                logger.warning(f"Missing counts by year record for {author_openalex_id} counts by year.")
                continue
            
            key = (author_id, count.get("year"))
            
            if key not in tuple_batches["author_counts_by_year"]:
                tuple_batches["author_counts_by_year"][key] = (
                    author_id,
                    count.get("year"),
                    count.get("works_count"),
                    count.get("oa_works_count"),
                    count.get("cited_by_count")
                )
                
    return tuple_batches
            
# ---------- INSERT REMAINING AUTHOR-RELATED TABLES ----------

def insert_remaining_tables_tuples(tuple_batches: dict, cur: cursor) -> None:
    # Initially, checking if there are any tuples to be inserted for the particular table
    if tuple_batches["author_affiliations"]:
        execute_values(cur,
            """
            INSERT INTO author_affiliations (
                author_id, institution_openalex_id, institution_ror,
                institution_display_name, institution_country_code, institution_type,
                lineage, years
            )
            VALUES %s
            ON CONFLICT (author_id, institution_openalex_id) DO UPDATE SET
                institution_ror = EXCLUDED.institution_ror,
                institution_display_name = EXCLUDED.institution_display_name,
                institution_country_code = EXCLUDED.institution_country_code,
                institution_type = EXCLUDED.institution_type,
                lineage = EXCLUDED.lineage,
                years = EXCLUDED.years;
            """,
            tuple_batches["author_affiliations"].values()
        )
        
    if tuple_batches["author_last_known_institutions"]:
        execute_values(cur,
            """
            INSERT INTO author_last_known_institutions (
                author_id, institution_openalex_id, institution_ror,
                institution_display_name, institution_country_code, institution_type,
                institution_lineage
            )
            VALUES %s
            ON CONFLICT (author_id, institution_openalex_id) DO UPDATE SET
                institution_ror = EXCLUDED.institution_ror,
                institution_display_name = EXCLUDED.institution_display_name,
                institution_country_code = EXCLUDED.institution_country_code,
                institution_type = EXCLUDED.institution_type,
                institution_lineage = EXCLUDED.institution_lineage;
            """,
            tuple_batches["author_last_known_institutions"].values()
        )
        
    if tuple_batches["author_topics"]:
        execute_values(cur,
            """
            INSERT INTO author_topics (
                author_id, topic_openalex_id, topic_display_name, works_count,
                domain_openalex_id, domain_display_name, field_openalex_id, field_display_name,
                subfield_openalex_id, subfield_display_name
            )
            VALUES %s
            ON CONFLICT (author_id, topic_openalex_id) DO UPDATE SET
                topic_display_name = EXCLUDED.topic_display_name,
                works_count = EXCLUDED.works_count,
                domain_openalex_id = EXCLUDED.domain_openalex_id,
                domain_display_name = EXCLUDED.domain_display_name,
                field_openalex_id = EXCLUDED.field_openalex_id,
                field_display_name = EXCLUDED.field_display_name,
                subfield_openalex_id = EXCLUDED.subfield_openalex_id,
                subfield_display_name = EXCLUDED.subfield_display_name;
            """,
            tuple_batches["author_topics"].values()
        )
        
    if tuple_batches["author_topic_share"]:
        execute_values(cur,
            """
            INSERT INTO author_topic_share (
                author_id, topic_openalex_id, topic_display_name, value, domain_openalex_id,
                domain_display_name, field_openalex_id, field_display_name,
                subfield_openalex_id, subfield_display_name
            )
            VALUES %s
            ON CONFLICT (author_id, topic_openalex_id) DO UPDATE SET
                topic_display_name = EXCLUDED.topic_display_name,
                value = EXCLUDED.value,
                domain_openalex_id = EXCLUDED.domain_openalex_id,
                domain_display_name = EXCLUDED.domain_display_name,
                field_openalex_id = EXCLUDED.field_openalex_id,
                field_display_name = EXCLUDED.field_display_name,
                subfield_openalex_id = EXCLUDED.subfield_openalex_id,
                subfield_display_name = EXCLUDED.subfield_display_name;
            """,
            tuple_batches["author_topic_share"].values()
        )
        
    if tuple_batches["author_counts_by_year"]:
        execute_values(cur,
            """
            INSERT INTO author_counts_by_year (
                author_id, year, works_count, oa_works_count, cited_by_count
            )
            VALUES %s
            ON CONFLICT (author_id, year) DO UPDATE SET
                works_count = EXCLUDED.works_count,
                oa_works_count = EXCLUDED.oa_works_count,
                cited_by_count = EXCLUDED.cited_by_count
            """,
            tuple_batches["author_counts_by_year"].values()
        )    


# ---------- UPDATE INTERNAL AUTHOR IDS IN paper_authors TABLE  ----------

def update_paper_author_ids(cur: cursor) -> None:
    query = """
        UPDATE paper_authors pa
        SET author_id = a.id
        FROM authors a
        WHERE pa.author_openalex_id = a.openalex_id 
          AND pa.author_id IS NULL;
    """
    
    cur.execute(query)
    return cur.rowcount
    
 
# --------- INGEST AUTHORS ---------

def ingest() -> None:
    logger.info("Starting OpenAlex Works ingestion")
    logger.info(f"Input file: {AUTHORS_JSONL_FILE}")
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
        total_authors = 0
    
        for batch_number, batch in enumerate(tqdm(read_jsonl_batch(AUTHORS_JSONL_FILE, BATCH_SIZE), desc="Ingesting Batches"), start=1):
            total_batches += 1
            total_authors += len(batch)
            logger.info(f"Batch {batch_number}: started with {len(batch)} authors.")
            
            if not batch:
                logger.info(f"Batch {batch_number}: no valid works, skipping...")
                continue
            
            author_ids = insert_authors(batch, cur)
            logger.info(f"Batch {batch_number}: papers inserted/updated={len(author_ids)}")
            
            tuple_batches = build_remaining_tables_tuples(batch, author_ids)
            logger.info(
                f"Batch {batch_number}: prepared tuples "
                f"affiliations={len(tuple_batches['author_affiliations'])}, "
                f"last_known_institutions={len(tuple_batches['author_last_known_institutions'])}, "
                f"topics={len(tuple_batches['author_topics'])}, "
                f"topic_shares={len(tuple_batches['author_topic_share'])}, "
                f"counts_by_year={len(tuple_batches['author_counts_by_year'])}"    
            )
            
            insert_remaining_tables_tuples(tuple_batches, cur)
            
             # Making sure to commit each batch before moving to the next batch
            conn.commit()
            logger.info(f"Batch {batch_number}: committed successfully")
            
        logger.info(f"Ingestion completed: batches={total_batches}, works={total_authors}")
        
        updated_count = update_paper_author_ids(cur)
        conn.commit()
        logger.info(f"Updated author_id in paper_authors for {updated_count} rows")
        
                  
    except Exception as e:
        if conn:
            conn.rollback()
            logger.exception("Ingestion failed. Current batch transaction was rolled back")
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
            logger.info("Database connection closed")
                    
    

if __name__ == "__main__":
    ingest()
