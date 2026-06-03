import json
from pathlib import Path
import time
import os
from dotenv import load_dotenv
import requests
from requests.exceptions import RequestException
import psycopg2
from scripts.utils.logging_utils import get_logger
from collections import defaultdict
from typing import Generator


load_dotenv()
API_KEY = os.getenv("OPENALEX_API_KEY")

DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

WORKS_URL = "https://api.openalex.org/works"

BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
REF_REL_WORKS_DIR = RAW_DIR / "referenced_related_works"

CHECKPOINT_DIR = BASE_DIR / "checkpoints"
LOG_DIR = BASE_DIR / "logs"

BATCH_SIZE = 100
BATCHES_DIR = REF_REL_WORKS_DIR / "batches"

IDS_FILE = REF_REL_WORKS_DIR / "ids_to_fetch.json"

CHECKPOINT_FILE = CHECKPOINT_DIR / "fetch_ref_rel_works_checkpoints.json"
LOG_FILE = LOG_DIR / "fetch_ref_rel_works.log"

logger = None

# Setup the OpenAlex's required subdirectories for API ingestion
def setup_directories() -> None:
    REF_REL_WORKS_DIR.mkdir(parents=True, exist_ok=True)
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

# ---------- IDS FILE UTILITIES ----------

def read_ref_rel_ids() -> list[str] | None:
    if not IDS_FILE.exists():
        return None
    
    with open(IDS_FILE, "r", encoding="utf-8") as f:
        payload = json.load(f)
    
    return payload["ids"]

def write_ref_rel_ids(ids_to_fetch: list[str]) -> None:
    payload = {
        "total_ids": len(ids_to_fetch),
        "ids": ids_to_fetch
    }
    
    with open(IDS_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    
        
# ---------- CHECKPOINT UTILITIES ------------ 

# Load referenced/related work checkpoint,
# in case the program crashes and needs to resume from where it stopped
def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
        
    return { "completed_batches": [] }

# Update checkpoint object every time a reference/related paper is fetched
def save_checkpoint(completed_batches: set[int]) -> None:
    payload = {
        "total_completed": len(completed_batches),
        "completed_batches": sorted(completed_batches),
    }
    
    # Initially storing new checkpoint to temporary file,
    temp_file = CHECKPOINT_FILE.with_suffix(".tmp")
    
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    
    # Using Atomic Replacement to ensure the checkpoint is correctly transfered from .tmp to the .json file
    temp_file.replace(CHECKPOINT_FILE)
    

# --------- CALCULATE THE REFERENCED/RELATED IDS FOR THE WORKS TO BE FETCHED ---------

def calculate_ref_rel_work_ids() -> list[str]: 
    conn = None
    cur = None

    ids_to_fetch = None

    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        
        cur = conn.cursor()
        
        # Fetching the stored OpenAlex ids from the main dataset 
        cur.execute("SELECT openalex_id FROM papers;")
        openalex_ids = cur.fetchall()
        
        stored_ids_set = set()
        for openalex_id in openalex_ids:
            stored_ids_set.add(openalex_id[0])
        
        # Fetching the stored references OpenAlex ids 
        # in descending order of appearances as references of the main dataset's papers
        cur.execute("""
            SELECT referenced_work_openalex_id, COUNT(*) AS occurrences
            FROM paper_references
            GROUP BY referenced_work_openalex_id
            ORDER BY occurrences DESC;
        """)
        
        ref_works_ids = cur.fetchall()
        
        # Fetching the stored related OpenAlex ids
        # in descending order of appearances as related papers of the main dataset's papers
        cur.execute("""
            SELECT related_work_openalex_id, COUNT(*) AS occurrences
            FROM paper_related
            GROUP BY related_work_openalex_id
            ORDER BY occurrences DESC;
        """)
        
        rel_works_ids = cur.fetchall()
        
        # Aggregating the total references of each reference / related paper in a dictionary 
        # as some paper are both references and related
        combined = defaultdict(lambda: {
            "reference_count": 0,
            "related_count": 0
        })
        
        for work_id, count in ref_works_ids:
            if work_id and work_id not in stored_ids_set:
                combined[work_id]["reference_count"] = count
                
        for work_id, count in rel_works_ids:
            if work_id and work_id not in stored_ids_set:
                combined[work_id]["related_count"] = count
                
        # Ranking references / related papers in descending order of the total number of appearances
        ranked = []
        
        for work_id, counts in combined.items():
            reference_count = counts["reference_count"]
            related_count = counts["related_count"]
            connection_count = reference_count + related_count
            
            ranked.append({
                "openalex_id": work_id,
                "reference_count": reference_count,
                "related_count": related_count,
                "connection_count": connection_count
            })    
            
        ranked.sort(
            key=lambda x: (x["connection_count"], x["related_count"], x["reference_count"]),
            reverse=True
        )
        
        # Retrieving the top 100,000 reference / related papers
        top_1m = ranked[:100000]
        
        ids_to_fetch = []
        for ref_rel_tuple in top_1m:
            ids_to_fetch.append(ref_rel_tuple["openalex_id"])
        
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


# -------- REQUEST THE REFERENCE / RELATED PAPER BY ID FROM OPENALEX API ---------
def request_json(batch_ids: list[str], timeout: int) -> dict:
    # Appending path parameter id
    params = {
        "filter": "openalex_id:" + "|".join(batch_ids),
        "per_page": len(batch_ids),
        "api_key": API_KEY
    }
    
    for attempt in range(1,5):
        try:
            response = requests.get(url=WORKS_URL, params=params, timeout=timeout)
            
            if response.status_code == 429:
                # If we reach the rate limit, we backoff for 30s, 60s, 90s, 120s, 
                # as the number of attempts increases
                wait_seconds = 30 * attempt
                #logger.warning("Reached rate limit. Sleeping for %ssecs.", wait_seconds)
                time.sleep(wait_seconds)
                continue
            
            # Raise exception if response's status code is different than 200
            response.raise_for_status()
            return response.json()
        
        except RequestException as e:
            #logger.warning("Request attempted %s failed: %s", attempt, e)
            time.sleep(5 * attempt)
            
    # If all 4 attempts fail, the request ultimately fails
    raise RuntimeError(f"Request failed after retries. params={params}")
            

# ---------- GENERATOR THAT RETRIEVES THE BATCHES OF OPENALEX IDS ----------

# Return the current batch of reference/related openalex ids
def batches(ids_to_fetch: list[str]) -> Generator[tuple[int, list[str]], None, None]:
    for i in range(0, len(ids_to_fetch), BATCH_SIZE):
        yield i // BATCH_SIZE + 1, ids_to_fetch[i:i+BATCH_SIZE] 


# ---------- NORMALIZE OPENALEX WORK ID ----------

def normalize_openalex_id(openalex_id: str | None) -> str | None:
    if not openalex_id:
        return None
    
    return openalex_id.rstrip("/").split("/")[-1]

# ---------- FETCH REFERENCE / RELATED PAPERS ----------

def fetch_ref_rel_works(ids_to_fetch: list, checkpoint: dict) -> None:
    completed_batches = set(checkpoint.get("completed_batches", []))
    
    total_batches = (len(ids_to_fetch) + BATCH_SIZE - 1) // BATCH_SIZE
    
    for batch_number, batch_ids in batches(ids_to_fetch):
        
        # If the current batch id is in the checkpoint, skip to the next id
        if batch_number in completed_batches:
            continue
        
        batch_file = BATCHES_DIR / f"batch_{batch_number:06d}.json"
        
        results = request_json(batch_ids, timeout=30)
        batch_of_works = results.get("results", []) 
        
        returned_ids = { 
            normalize_openalex_id(work.get("id")) for work in batch_of_works if work.get("id")
        }
        
        requested_ids = set(batch_ids)
        missing_ids = requested_ids - returned_ids
        
        payload = {
            "batch_number": batch_number,
            "requested_count": len(batch_ids),
            "returned_count": len(batch_of_works),
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
        
        logger.info(
            "Fetched batch %s/%s: requested=%s, returned=%d, missing=%d", 
            batch_number, 
            total_batches,
            len(batch_ids),
            len(batch_of_works),
            len(batch_ids) - len(batch_of_works)
        )
        
        time.sleep(0.1)
        
            
def main():
    # We verify the existence of the API key before hitting the API endpoints
    if not API_KEY:
        raise RuntimeError("OPENALEX API KEY is missing.")
    
    # Setting up subdirectory structures 
    setup_directories()
    
    global logger
    logger = get_logger(name="fetch_openalex", log_file=LOG_FILE)
    
    # read referenced / related from JSON files if already calculated
    ids_to_fetch = read_ref_rel_ids()
    
    if ids_to_fetch is None:
        # Calculate referenced & related work ids to fetch, and store them in JSON file for reproducibility
        ref_rel_work_ids = calculate_ref_rel_work_ids()
        write_ref_rel_ids(ref_rel_work_ids)
        ids_to_fetch = ref_rel_work_ids
    
    logger.info("Total referenced/related IDs to fetch: %s", len(ids_to_fetch))
    
    checkpoint = load_checkpoint()
    
    fetch_ref_rel_works(ids_to_fetch, checkpoint)

    
if __name__ == "__main__":
    main()