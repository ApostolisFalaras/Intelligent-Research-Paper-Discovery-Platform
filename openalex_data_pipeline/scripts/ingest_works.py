import json
from tqdm import tqdm
from pathlib import Path
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import cursor
from utils.logging_utils import get_logger

# Load DB Environmental variables
load_dotenv()
DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")


BASE_DIR = Path(__file__).parent.parent
LOG_DIR = BASE_DIR / "logs"

GLOBAL_JSONL_FILE = BASE_DIR / "data/processed/works/global/works.jsonl"
BATCH_SIZE = 5000

LOG_FILE = LOG_DIR / "ingest_openalex_works.log"
logger = get_logger("ingest_openalex", log_file=LOG_FILE)

# --------- DATASET BATCHES UTILITIES ------------

# Generator that reads and returns a batch of input JSONL paper rows
def read_jsonl_batch(file: Path, size: int):
    batch = []
    
    with open(file, "r", encoding="utf-8") as f:
        for line in f:
            # If the line is empty skip it
            if not line.strip():
                continue
            
            # Add deserialized dictionary to the batch, and if the batch is full, yield it
            batch.append(json.loads(line))
            if len(batch) >= size:
                yield batch
                batch = []
    
    # Yield any remainining paper rows that didn't fit in a full batch
    if batch:
        yield batch


# ---------- INSERT WORKS (PAPERS) TUPLES -----------

def insert_papers(works_batch: list[dict], cur: cursor) -> dict:
    paper_rows = []
    
    for work in works_batch:
        
        # As a safety check, I make sure all nested fields contain actual data, or otherwise use {}
        # This also applies to all tuple construction processes in the below functions
        paper_rows.append((
            work.get("id"),
            work.get("doi"), 
            work.get("title") or work.get("display_name"), 
            work.get("display_name") or work.get("title") or work.get("doi") or work.get("id"), 
            work.get("abstract_text"),
            work.get("publication_year"), 
            work.get("publication_date"), 
            work.get("language"), 
            work.get("type"),
            work.get("cited_by_count"),
            work.get("fwci"),
            (work.get("citation_normalized_percentile") or {}).get("value"),
            (work.get("citation_normalized_percentile") or {}).get("is_in_top_1_percent"),
            (work.get("citation_normalized_percentile") or {}).get("is_in_top_10_percent"),
            (work.get("cited_by_percentile_year") or {}).get("min"),
            (work.get("cited_by_percentile_year") or {}).get("max"),
            work.get("referenced_works_count"),
            ((work.get("primary_location") or {}).get("source") or {}).get("id"),
            ((work.get("primary_location") or {}).get("source") or {}).get("display_name"),
            ((work.get("primary_location") or {}).get("source") or {}).get("type"),
            (work.get("biblio") or {}).get("volume"),
            (work.get("biblio") or {}).get("issue"),
            (work.get("biblio") or {}).get("first_page"),
            (work.get("biblio") or {}).get("last_page"),
            (work.get("primary_topic") or {}).get("id"),
            (work.get("primary_topic") or {}).get("display_name"),
            ((work.get("primary_topic") or {}).get("domain") or {}).get("id"),
            ((work.get("primary_topic") or {}).get("domain") or {}).get("display_name"),
            ((work.get("primary_topic") or {}).get("field") or {}).get("id"),
            ((work.get("primary_topic") or {}).get("field") or {}).get("display_name"),
            ((work.get("primary_topic") or {}).get("subfield") or {}).get("id"),
            ((work.get("primary_topic") or {}).get("subfield") or {}).get("display_name"),
            work.get("locations_count"),
            work.get("countries_distinct_count"),
            work.get("institutions_distinct_count"),
            (work.get("open_access") or {}).get("is_oa"),
            (work.get("open_access") or {}).get("oa_status"),
            (work.get("open_access") or {}).get("oa_url"),
            (work.get("open_access") or {}).get("any_repository_has_fulltext"),
            work.get("has_fulltext"),
            (work.get("has_content") or {}).get("pdf"),
            (work.get("has_content") or {}).get("grobid_xml"),
            work.get("indexed_in"),
            work.get("is_retracted"),
            work.get("is_paratext"),
            work.get("created_date"),
            work.get("updated_date")
        ))
    
    # Some paper data are dynamic, such as cited_by_count, fwci, and must be updated if 
    # a duplicate paper stores different values for them.
    # This also applies to features of many tables in the below functions
    query = """
        INSERT INTO papers (
            openalex_id, doi, title, display_name, abstract, publication_year, publication_date,
            language, paper_type, cited_by_count, fwci, citation_normalized_percentile_value,
            citation_top_1_percent, citation_top_10_percent, cited_by_percentile_year_min,
            cited_by_percentile_year_max, referenced_works_count, primary_source_openalex_id,
            primary_source_display_name, primary_source_type, biblio_volume, biblio_issue,
            biblio_first_page, biblio_last_page, primary_topic_openalex_id, primary_topic_display_name,
            primary_domain_openalex_id, primary_domain_display_name, primary_field_openalex_id,
            primary_field_display_name, primary_subfield_openalex_id, primary_subfield_display_name,
            locations_count, countries_distinct_count, institutions_distinct_count, is_open_access,
            open_access_status, open_access_best_url, open_access_any_repo_has_fulltext,
            has_fulltext, has_content_pdf, has_content_grobid_xml, indexed_in, is_retracted, is_paratext,
            openalex_created_at, openalex_updated_at 
        )
        VALUES %s
        ON CONFLICT (openalex_id) DO UPDATE SET
            cited_by_count = EXCLUDED.cited_by_count,
            fwci = EXCLUDED.fwci,
            openalex_updated_at = EXCLUDED.openalex_updated_at
        RETURNING openalex_id, id;
    """

    # results has the form [ (https://openalex.org/W123, 1), (https://openalex.org/W456, 2), ....]
    results = execute_values(cur, query, paper_rows, fetch=True)
    return dict(results)
    
# ---------- INSERT PAPER_AUTHORS TUPLES -----------

def insert_paper_authors(works_batch: list[dict], paper_ids: dict, cur: cursor) -> dict:
    paper_author_rows = {}
    
    for work in works_batch:
        paper_id = paper_ids.get(work.get("id"))
        if not paper_id:
            logger.warning(f"Missing paper_id for {work.get('id')} while inserting authors.")
            continue
        
        for author_order, authorship in enumerate(work.get("authorships") or [], start=1):
            author = authorship.get("author") or {}
            author_id = author.get("id")
            
            # We need to perform deduplication of paper_author tuples, since the same author 
            # can have multiple authorships for the same paper
            key = (paper_id, author_order)
            
            if key not in paper_author_rows:
                paper_author_rows[key] = (
                    paper_id,
                    author_order,
                    author_id,
                    author.get("display_name") or authorship.get("raw_author_name") or "Unknown Author",
                    author.get("orcid"),
                    authorship.get("author_position"),
                    authorship.get("is_corresponding"),
                    authorship.get("raw_author_name")
                )
    
    if not paper_author_rows:
        return {}
            
    query = """
        INSERT INTO paper_authors (
            paper_id, author_order, author_openalex_id, author_display_name, author_orcid, author_position,
            is_corresponding, raw_author_name
        )
        VALUES %s
        ON CONFLICT (paper_id, author_order) DO UPDATE SET
            author_openalex_id = EXCLUDED.author_openalex_id,
            author_display_name = EXCLUDED.author_display_name,
            author_orcid = EXCLUDED.author_orcid,
            author_position = EXCLUDED.author_position,
            is_corresponding = EXCLUDED.is_corresponding,
            raw_author_name = EXCLUDED.raw_author_name
        RETURNING paper_id, author_order, id;
    """
    
    results = execute_values(cur, query, paper_author_rows.values(), fetch=True)
    return {
        (paper_id, author_order): paper_author_id for paper_id, author_order, paper_author_id in results
    }
    
# ---------- BUILD REMAINING TABLES' TUPLES -----------
    
def build_remaining_tables_tuples(work_batch: list[dict], paper_ids: dict, paper_author_ids: dict) -> dict:
    # I use dictionaries of tuples for each table's tuples,
    # to deduplicate using a key based on the unique constraint of each table's schema
    tuple_batches = {
        "paper_author_institutions_rows": {},
        "paper_author_affiliations_rows": {},
        "paper_topics_rows": {}, 
        "paper_keywords_rows": {}, 
        "paper_locations_rows": {}, 
        "paper_references_rows": {},
        "paper_related_rows": {},
        "paper_counts_by_year_rows": {}
    }
    
    for work in work_batch or []:
        paper_id = paper_ids.get(work.get("id"))
        
        # Safety check: If the paper doesn't have a valid id, we can't insert any data included in it
        if not paper_id:
            logger.warning(f"Missing paper_id for {work.get('id')} while inserting authors.")
            continue
        
        # Setting up paper_author_institutions and paper_author_affiliations tuples
        for author_order, authorship in enumerate(work.get("authorships") or [], start=1):
            author = authorship.get("author") or {}
            
            paper_author_id = paper_author_ids.get((paper_id, author_order))

            # Safety check: If the don't have a valid paper-author connection id
            # we cannot insert the associated institutions and affiliations for that author
            if not paper_author_id:
                logger.warning(
                    f"Missing paper_author_id for ({paper_id}, {author_order}) paper author-orderorder pair."
                )
                continue
            
            for institution in authorship.get("institutions") or []:
                institution_id = institution.get("id")
                institution_name = institution.get("display_name")
                
                if not institution_id and not institution_name:
                    continue
                
                # Deduplication key
                key = (paper_author_id, institution_id or institution_name)
                
                if key not in tuple_batches["paper_author_institutions_rows"]:
                    tuple_batches["paper_author_institutions_rows"][key] = (
                        paper_author_id,
                        institution_id,
                        institution_name or "Unknown Institution",
                        institution.get("ror"),
                        institution.get("country_code"),
                        institution.get("type"),
                        institution.get("lineage")
                    )
                
            for affiliation in authorship.get("affiliations") or []:
                raw_affiliation_string = affiliation.get("raw_affiliation_string")
                
                if not raw_affiliation_string:
                    continue
                
                # Deduplication key
                key = (paper_author_id, raw_affiliation_string)
                
                if key not in tuple_batches["paper_author_affiliations_rows"]:
                    tuple_batches["paper_author_affiliations_rows"][key] = (
                        paper_author_id,
                        affiliation.get("raw_affiliation_string"),
                        affiliation.get("institution_ids")
                    )
                
        # Setting up paper_topics tuples
        for topic in work.get("topics") or []:
            topic_id = topic.get("id")
            topic_name = topic.get("display_name")
            
            if not topic_id and not topic_name:
                continue
            
            is_primary_topic = True if (work.get("primary_topic") or {}).get("id") == topic_id else False
            
            key = (paper_id, topic_id or topic_name)
            
            if key not in tuple_batches["paper_topics_rows"]:
                tuple_batches["paper_topics_rows"][key] = (
                    paper_id,
                    topic_id,
                    topic_name or "Unknown Topic",
                    topic.get("score"),
                    (topic.get("domain") or {}).get("id"),
                    (topic.get("domain") or {}).get("display_name"),
                    (topic.get("field") or {}).get("id"),
                    (topic.get("field") or {}).get("display_name"),
                    (topic.get("subfield") or {}).get("id"),
                    (topic.get("subfield") or {}).get("display_name"),
                    is_primary_topic
                )
            
        # Setting up paper_keywords tuples
        for keyword in work.get("keywords") or []:
            keyword_name = keyword.get("display_name")

            if not keyword_name:
                continue
            
            key = (paper_id, keyword_name)
            
            if key not in tuple_batches["paper_keywords_rows"]:
                tuple_batches["paper_keywords_rows"][key] = (
                    paper_id,
                    keyword.get("id"),
                    keyword.get("display_name"),
                    keyword.get("score")
                )
            
        # Setting up paper_locations tuples
        for location in work.get("locations") or []:
            location_id = location.get("id")
            if not location_id:
                logger.warning(f"Missing location_id for {work.get('id')} paper.")
                continue
            
            key = (paper_id, location_id)
            
            if key not in tuple_batches["paper_locations_rows"]:
                
                source = location.get("source") or {}
                is_primary_location = True if (work.get("primary_location") or {}).get("id") == location_id else False 
                is_best_oa = True if (work.get("best_oa_location") or {}).get("id") == location_id else False
                
                tuple_batches["paper_locations_rows"][key] = (
                    paper_id,
                    location_id,
                    location.get("is_oa"),
                    location.get("landing_page_url"),
                    location.get("pdf_url"),
                    source.get("id"),
                    source.get("display_name"),
                    source.get("issn_l"),
                    source.get("issn"),
                    source.get("is_oa"),
                    source.get("is_in_doaj"),
                    source.get("is_core"),
                    source.get("host_organization"),
                    source.get("host_organization_name"),
                    source.get("host_organization_lineage"),
                    source.get("type"),
                    location.get("license"),
                    location.get("license_id"),
                    location.get("version"),
                    location.get("is_accepted"),
                    location.get("is_published"),
                    location.get("raw_source_name"),
                    location.get("raw_type"),
                    is_primary_location,
                    is_best_oa
                )
            
        # Setting up paper_references tuples
        for reference in work.get("referenced_works") or []:
            if not reference:
                continue
            
            key = (paper_id, reference)
            
            if key not in tuple_batches["paper_references_rows"]:
                tuple_batches["paper_references_rows"][key] = (
                    paper_id,
                    reference
                )
        
        # Setting up paper_related tuples
        for related in work.get("related_works") or []:
            if not related:
                continue
            
            key = (paper_id, related)
            
            if key not in tuple_batches["paper_related_rows"]:
                tuple_batches["paper_related_rows"][key] = (
                    paper_id,
                    related
                )
        
        # Setting up paper_counts_by_year tuples
        for counts_in_a_year in work.get("counts_by_year") or []:
            year = counts_in_a_year.get("year")
            
            if not year:
                continue
            
            key = (paper_id, year)
            
            if key not in tuple_batches["paper_counts_by_year_rows"]:
                tuple_batches["paper_counts_by_year_rows"][key] = (
                    paper_id,
                    counts_in_a_year.get("year"),
                    counts_in_a_year.get("cited_by_count") or 0
                )
            
    return tuple_batches
        
# ---------- BUILD REMAINING TABLES' TUPLES -----------

def insert_remaining_tables_tuples(tuple_batches: dict, cur: cursor) -> None:
    # Initially, checking if there are any tuples to be inserted for the particular table
    if tuple_batches["paper_author_institutions_rows"]:
        execute_values(
            cur,
            """
            INSERT INTO paper_author_institutions (
                paper_author_id, institution_openalex_id, institution_display_name,
                institution_ror, country_code, institution_type, lineage
            )
            VALUES %s
            ON CONFLICT (paper_author_id, institution_display_name) DO NOTHING;
            """,
            tuple_batches["paper_author_institutions_rows"].values()
        )
    
    if tuple_batches["paper_author_affiliations_rows"]:
        execute_values(
            cur,
            """
            INSERT INTO paper_author_affiliations (
                paper_author_id, raw_affiliation_string, institution_ids
            )
            VALUES %s;
            """,
            tuple_batches["paper_author_affiliations_rows"].values()
        )
    
    if tuple_batches["paper_topics_rows"]:
        execute_values(
            cur,
            """ 
            INSERT INTO paper_topics (
                paper_id, topic_openalex_id, topic_display_name, score, domain_openalex_id,
                domain_display_name, field_openalex_id, field_display_name, subfield_openalex_id,
                subfield_display_name, is_primary_topic
            )
            VALUES %s
            ON CONFLICT (paper_id, topic_display_name) DO UPDATE SET
                score = EXCLUDED.score,
                is_primary_topic = EXCLUDED.is_primary_topic;
            """,
            tuple_batches["paper_topics_rows"].values()
        )
        
    if tuple_batches["paper_keywords_rows"]:
        execute_values(
            cur,
            """ 
            INSERT INTO paper_keywords (
                paper_id, keyword_openalex_id, keyword_display_name, score
            )
            VALUES %s
            ON CONFLICT (paper_id, keyword_display_name) DO UPDATE SET
                score = EXCLUDED.score;
            """,
            tuple_batches["paper_keywords_rows"].values()
        )
        
    if tuple_batches["paper_locations_rows"]:
        execute_values(
            cur,
            """ 
            INSERT INTO paper_locations (
                paper_id, location_openalex_id, is_oa, landing_page_url, pdf_url, source_openalex_id,
                source_display_name, source_issn_l, source_issn, source_is_oa, source_is_in_doaj, 
                source_is_core, source_host_organization, source_host_organization_name,
                source_host_organization_lineage, source_type, license, license_id, version, is_accepted,
                is_published, raw_source_name, raw_type, is_primary, is_best_oa
            )
            VALUES %s
            ON CONFLICT (paper_id, location_openalex_id) DO UPDATE SET
                is_oa = EXCLUDED.is_oa,
                landing_page_url = EXCLUDED.landing_page_url,
                pdf_url = EXCLUDED.pdf_url,
                source_openalex_id = EXCLUDED.source_openalex_id,
                source_display_name = EXCLUDED.source_display_name,
                license = EXCLUDED.license,
                version = EXCLUDED.version,
                is_accepted = EXCLUDED.is_accepted,
                is_published = EXCLUDED.is_published,
                is_primary = EXCLUDED.is_primary,
                is_best_oa = EXCLUDED.is_best_oa; 
            """,
            tuple_batches["paper_locations_rows"].values() 
        )
        
    if tuple_batches["paper_references_rows"]:
        execute_values(
            cur,
            """ 
            INSERT INTO paper_references (
                paper_id, referenced_work_openalex_id
            )
            VALUES %s
            ON CONFLICT (paper_id, referenced_work_openalex_id) DO NOTHING;
            """,
            tuple_batches["paper_references_rows"].values()
        )
        
    if tuple_batches["paper_related_rows"]:
        execute_values(
            cur,
            """ 
            INSERT INTO paper_related (
                paper_id, related_work_openalex_id
            )
            VALUES %s
            ON CONFLICT (paper_id, related_work_openalex_id) DO NOTHING;
            """,
            tuple_batches["paper_related_rows"].values()
        )
        
    if tuple_batches["paper_counts_by_year_rows"]:
        execute_values(
            cur,
            """ 
            INSERT INTO paper_counts_by_year (
                paper_id, year, cited_by_count
            )
            VALUES %s
            ON CONFLICT (paper_id, year) DO UPDATE SET
                cited_by_count = EXCLUDED.cited_by_count;
            """,
            tuple_batches["paper_counts_by_year_rows"].values()
        )
    
    
# --------- DATASET INGESTION ----------
def ingest() -> None:
    logger.info("Starting OpenAlex Works ingestion")
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
            
            # Insert batch of papers
            paper_ids = insert_papers(batch, cur)
            logger.info(f"Batch {batch_number}: papers inserted/updated={len(paper_ids)}")
            
            # Insert paper-author tuples for the current batch of papers
            paper_author_ids = insert_paper_authors(batch, paper_ids, cur)
            logger.info(f"Batch {batch_number}: paper_authors inserted/updates={len(paper_author_ids)}")
            
            # Populate the rest of the tables for the current batch of papers
            tuple_batches = build_remaining_tables_tuples(batch, paper_ids, paper_author_ids)
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
        # regardless of the outcome's success/failute
        if cur:
            cur.close()
        if conn:
            conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    ingest()    