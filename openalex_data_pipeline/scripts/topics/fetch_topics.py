import json
from pathlib import Path
import os
from dotenv import load_dotenv
from tqdm import tqdm
import time
import requests
from typing import Generator
import psycopg2
from scripts.utils.logging_utils import get_logger

load_dotenv()
API_KEY = os.getenv("OPENALEX_API_KEY")

DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

TOPICS_URL = "https://api.openalex.org/topics"

BATCH_SIZE = 100

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = BASE_DIR / "data/raw"

REF_REL_WORKS_FILE = BASE_DIR / "data/processed/referenced_related_works/ref_rel_works.jsonl"

TOPICS_DIR = RAW_DIR / "topics"
TOPIC_BATCHES_DIR = TOPICS_DIR / "batches"
AUTHOR_DIR = RAW_DIR / "authors/batches"

CHECKPOINT_DIR = BASE_DIR / "checkpoints"
LOG_DIR = BASE_DIR / "logs"

TOPICS_FILE = TOPICS_DIR / "fetch_openalex_topics.json"
IDS_FILE = TOPICS_DIR / "ids_to_fetch.json"

CHECKPOINT_FILE = CHECKPOINT_DIR / "fetch_openalex_topics_checkpoint.json"
LOG_FILE = LOG_DIR / "fetch_openalex_topics.log"

 
logger = None


def setup_directories() -> None:
    TOPIC_BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    
    
# -------- PROCESSING UTILITIES --------

# Normalize openalex ids by extracting the last part of the URL
def normalize_openalex_id(topic_openalex_id: str | None) -> str | None:
    if not topic_openalex_id:
        return None
    
    return topic_openalex_id.rstrip("/").split("/")[-1]
    
# Read the remaining topic ids from a json file
def read_topic_ids() -> list[str] | None:
    if not IDS_FILE.exists():
        return None
    
    with open(IDS_FILE, "r", encoding="utf-8") as f:
        payload = json.load(f)
        
    return payload["ids"]

# Write remaining topic ids to fetch in a json file for reproducibility
def write_topic_ids(ids_to_fetch: list[str]) -> None:
    payload = {
        "total_ids": len(ids_to_fetch),
        "ids": ids_to_fetch
    }
    
    with open(IDS_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        
        
# --------- CHECKPOINT UTILITIES ---------

def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
        
    return { "completed_batches": [] }


def save_checkpoint(completed_batches: set[int]) -> None:
    payload = {
        "total_batches": len(completed_batches),
        "completed_batches": sorted(completed_batches)
    }
    
    # Initially storing new checkpoint to temporary file,
    temp_file = CHECKPOINT_FILE.with_suffix(".tmp")
    
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        
    # Using Atomic Replacement to ensure the checkpoint is correctly transfered from .tmp to the .json file
    temp_file.replace(CHECKPOINT_FILE)
    

# --------- CALCULATE REMAINING TOPIC IDS ---------

# Fetch topic ids from paper_topics table, as papers can belong to multiple topics,
# and not only the top 100 topics
def fetch_topic_ids_from_paper_topics() -> set[str]:
    topic_ids = set()

    conn = None
    cur = None

    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )

        cur = conn.cursor()

        cur.execute("""
            SELECT DISTINCT topic_openalex_id
            FROM paper_topics
            WHERE topic_openalex_id IS NOT NULL;
        """)

        for (topic_openalex_id,) in cur.fetchall():
            topic_id = normalize_openalex_id(topic_openalex_id)

            if topic_id:
                topic_ids.add(topic_id)

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    return topic_ids


def calculate_additional_topic_ids() -> list[str]:
    seen_ids = set()
    author_related_topic_ids = set()
    ref_rel_topic_ids = set()
    
    # Accessing the already-fetched top-100 most popular topic ids
    with open(TOPICS_FILE, "r", encoding="utf-8") as f:
        topics = json.load(f)
        
        for topic in topics:
            seen_ids.add(normalize_openalex_id(topic["id"]))
            
    # Fetching all topics that are associated with the fetched 100K authors
    for batch in sorted(AUTHOR_DIR.glob("*.json")):
        with open(batch, "r", encoding="utf-8") as f:
            payload = json.load(f)
            
            for result in payload["response"]["results"]:
                for topic in result.get("topics") or []:
                    author_related_topic_ids.add(normalize_openalex_id(topic["id"]))
    
    # Fetching all topics that are associated with the fetched 100K reference / related papers
    if REF_REL_WORKS_FILE.exists():
        with open(REF_REL_WORKS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                
                work = json.loads(line)
                
                primary_topic_id = normalize_openalex_id(
                    (work.get("primary_topic") or {}).get("id")
                )
                
                if primary_topic_id:
                    ref_rel_topic_ids.add(primary_topic_id)
                    
                for topic in work.get("topics") or []:
                    topic_id = normalize_openalex_id(topic.get("id"))
                    if topic_id:
                        ref_rel_topic_ids.add(topic_id)
    
    paper_topic_ids = fetch_topic_ids_from_paper_topics()
    
    all_candidate_topic_ids = author_related_topic_ids | ref_rel_topic_ids | paper_topic_ids
    
    remaining_topic_ids = sorted(all_candidate_topic_ids - seen_ids)
    
    logger.info("Seed top-100 topics: %s", len(seen_ids))
    logger.info("Author-related topics: %s", len(author_related_topic_ids))
    logger.info("Referenced/related work topics: %s", len(ref_rel_topic_ids))
    logger.info("Paper topic IDs from DB: %s", len(paper_topic_ids))
    logger.info("Total additional topics to fetch: %s", len(remaining_topic_ids))
    
    return remaining_topic_ids
    
    
# --------- REQUEST BATCH OF TOPICS ---------

def request_json(batch_ids: list[str], timeout: int) -> dict:
    params = {
        "filter": "ids.openalex:" + "|".join(batch_ids),
        "per_page": len(batch_ids),
        "api_key": API_KEY
    }
    
    for attempt in range(1, 5):
        try:
            response = requests.get(url=TOPICS_URL, params=params, timeout=timeout)
            
            if response.status_code == 429:
                # If we reach the rate limit, we backoff for 30s, 60s, 90s, 120s, 
                # as the number of attempts increases
                wait_seconds = 30 * attempt
                logger.warning("Reached rate limit. Sleeping for %ssecs.", wait_seconds)
                time.sleep(wait_seconds)
                continue
                
            response.raise_for_status()
            return response.json()
        
        except Exception as e:
            logger.warning("Request attempted %s failed: %s", attempt, e)
            time.sleep(5 * attempt)
            
    # If all 4 attempts fail, the request ultimately fails 
    raise RuntimeError(f"Request failed after retries. params={params}")


# --------- GENERATOR THAT YIELDS THE TOPIC ID BATCHES ---------

def batches(ids_to_fetch: list[str]) -> Generator[tuple[int, list[str]], None, None]:
    for i in range(0, len(ids_to_fetch), BATCH_SIZE):
        yield i // BATCH_SIZE + 1, ids_to_fetch[i:i+BATCH_SIZE]


# ---------- FETCH TOPICS ----------        

def fetch_topics(ids_to_fetch: list[str], checkpoint: dict) -> None:
    completed_batches = set(checkpoint.get("completed_batches") or [])
    
    total_batches = (len(ids_to_fetch) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_number, batch_ids in batches(ids_to_fetch):
        if batch_number in completed_batches:
            continue
        
        batch_file = TOPIC_BATCHES_DIR / f"batch_{batch_number:06d}.json"
        
        results = request_json(batch_ids, timeout=30)
        batch_of_topics = results.get("results", [])
        
        returned_ids = {
            normalize_openalex_id(topic.get("id")) for topic in batch_of_topics if topic.get("id")
        }
        requested_ids = set(batch_ids)
        missing_ids = requested_ids - returned_ids
        
        payload = {
            "batch_number": batch_number,
            "requested_count": len(requested_ids),
            "returned_count": len(returned_ids),
            "missing_count": len(missing_ids),
            "requested_ids": batch_ids,
            "returned_ids": sorted(returned_ids),
            "missing_ids": sorted(missing_ids),
            "response": results
        }
        
        with open(batch_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
            
        completed_batches.add(batch_number)
        save_checkpoint(completed_batches)
        
        logger.info("Fetched batch %s/%s: requested=%s, returned=%d, missing=%d", 
            batch_number, 
            total_batches,
            len(batch_ids),
            len(batch_of_topics),
            len(batch_ids) - len(batch_of_topics)
        )
        
        time.sleep(0.1)
        
        
def main() -> None:
    global logger
    logger = get_logger(name="fetch_openalex", log_file=LOG_FILE)
    
    setup_directories()
    
    logger.info("Fetching all topics associated with the selected papers, authors and the reference / related papers")
    
    ids_to_fetch = read_topic_ids()
    
    if ids_to_fetch is None:
        ids_to_fetch = calculate_additional_topic_ids()
        write_topic_ids(ids_to_fetch)
    
    checkpoint = load_checkpoint()
    
    fetch_topics(ids_to_fetch, checkpoint)

    
if __name__ == "__main__":
    main()