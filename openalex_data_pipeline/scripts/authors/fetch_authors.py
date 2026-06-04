import json
import os
import time
from dotenv import load_dotenv
from pathlib import Path
import requests
from requests.exceptions import RequestException
import psycopg2
from typing import Generator
from scripts.utils.logging_utils import get_logger

load_dotenv()
API_KEY = os.getenv("OPENALEX_API_KEY")

DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

logger = None

BATCH_SIZE = 100

AUTHORS_URL = "https://api.openalex.org/authors"

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_DIR = BASE_DIR / "data/raw"
AUTHORS_DIR = RAW_DIR / "authors"
AUTHORS_BATCHES_DIR = AUTHORS_DIR / "batches"

CHECKPOINT_DIR = BASE_DIR / "checkpoints"
LOG_DIR = BASE_DIR / "logs" 

IDS_FILE = AUTHORS_DIR / "ids_to_fetch.json"
CHECKPOINT_FILE = CHECKPOINT_DIR / "fetch_openalex_authors_checkpoints.json"
LOG_FILE = LOG_DIR / "fetch_openalex_authors.log"


# --------- SETUP DIRECTORY STRUCTURE ---------

def setup_directories() -> None:
    AUTHORS_DIR.mkdir(parents=True, exist_ok=True)
    AUTHORS_BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    
    
# --------- READ AUTHOR IDS FROM JSON FILE ---------

def read_author_ids() -> list[str] | None:
    if not IDS_FILE.exists():
        return None
    
    with open(IDS_FILE, "r", encoding="utf-8") as f:
        payload = json.load(f)
        
    return payload["ids"]

def write_author_ids(ids_to_fetch: list[str]) -> None:
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
    
    
# --------- CALCULATE TOP 100K AUTHORS WITH MOST APPEARANCES ---------

def calculate_top_author_ids():
    conn = None
    cur = None
    
    try:
        # Setup connection & cursor
        conn = psycopg2.connect(
            dbname=DB_NAME,
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        
        cur = conn.cursor()
        
        # Fetch all existing OpenAlex author ids in descending order of occurrences in paper_authors relation
        cur.execute("""
            SELECT author_openalex_id, COUNT(*) AS occurrences
            FROM paper_authors
            WHERE author_openalex_id IS NOT NULL
            GROUP BY author_openalex_id
            ORDER BY occurrences DESC;
        """)
        
        results = cur.fetchall()
        
        ids_to_fetch = []
        for id_tuple in results[:100000]:
            ids_to_fetch.append(id_tuple[0]) 
        
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    return ids_to_fetch


# --------- CALCULATE TOP 100K AUTHORS WITH MOST APPEARANCES ---------

def request_json(batch_ids: list[str], timeout: int) -> dict:
    params = {
        "filter": "openalex_id:" + "|".join(batch_ids),
        "per_page": len(batch_ids),
        "api_key": API_KEY
    }
    
    for attempt in range(1, 5):
        try:
            response = requests.get(url=AUTHORS_URL, params=params, timeout=timeout)
            
            if response.status_code == 429:
                # If we reach the rate limit, we backoff for 30s, 60s, 90s, 120s, 
                # as the number of attempts increases
                wait_seconds = 30 * attempt
                logger.warning("Reached rate limit. Sleeping for %ssecs.", wait_seconds)
                time.sleep(wait_seconds)
                continue
            
            # Raise exception if response's status code is different than 200
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.warning("Request attempted %s failed: %s", attempt, e)
            time.sleep(5 * attempt)
    
    # If all 4 attempts fail, the request ultimately fails
    raise RuntimeError(f"Request failed after retries. params={params}")
        

# --------- GENERATOR THAT YIELDS THE AUTHOR ID BATCHES --------- 

def batches(ids_to_fetch: list[str]) -> Generator[tuple[int, list[str]], None, None]:
    for i in range(0, len(ids_to_fetch), BATCH_SIZE):
        yield i // BATCH_SIZE + 1, ids_to_fetch[i:i+BATCH_SIZE]
        
# --------- NORMALIZE AUTHOR OPENALEX IDS ---------

def normalize_openalex_id(openalex_id: str | None) -> str | None:
    if openalex_id is None:
        return None
    
    return openalex_id.rstrip("/").split("/")[-1]
        
 
# --------- FETCH AUTHORS --------- 

def fetch_authors(ids_to_fetch: list[str], checkpoint: dict) -> None:
    completed_batches = set(checkpoint.get("completed_batches", []))
    
    total_batches = (len(ids_to_fetch) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_number, batch_ids in batches(ids_to_fetch):
        if batch_number in completed_batches:
            continue
        
        batch_file = AUTHORS_BATCHES_DIR / f"batch_{batch_number:06d}.json"
        
        results = request_json(batch_ids, timeout=30)
        batch_of_authors = results.get("results", [])
        
        returned_ids = { 
            normalize_openalex_id(author.get("id")) for author in batch_of_authors if author.get("id")
        }
        requested_ids = set(batch_ids)
        missing_ids = requested_ids - returned_ids
        
        
        payload = {
            "batch_number": batch_number,
            "requested_count": len(batch_ids),
            "returned_count": len(batch_of_authors),
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
            len(batch_of_authors),
            len(batch_ids) - len(batch_of_authors)
        )
        
        time.sleep(0.1)
           

# --------- MAIN METHOD TO FETCH AUTHORS ---------

def main() -> None:
    global logger
    logger = get_logger(name="fetch_openalex_authors", log_file=LOG_FILE)
    
    setup_directories()
    
    logger.info("Fetching top 100K authors with most appearances in the current dataset")
    
    ids_to_fetch = read_author_ids()
    
    if ids_to_fetch is None:
        ids_to_fetch = calculate_top_author_ids()
        write_author_ids(ids_to_fetch)
        
        
    print(len(ids_to_fetch))
    
    checkpoint = load_checkpoint()
    
    fetch_authors(ids_to_fetch, checkpoint)
    
    logger.info("Fetching of authors completed")
    
    
if __name__ == "__main__":
    main()
