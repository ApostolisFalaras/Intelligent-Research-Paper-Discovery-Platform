import json
import copy
from pathlib import Path
from scripts.utils.logging_utils import get_logger

logger = None

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"

RAW_AUTHORS_DIR = DATA_DIR / "raw/authors/batches"
PROCESSED_AUTHORS_DIR = DATA_DIR / "processed/authors"
AUTHORS_JSONL_FILE = PROCESSED_AUTHORS_DIR / "authors.jsonl"

LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "preprocess_openalex_authors"


# --------- NORMALIZE AUTHOR OPENALEX IDS ---------

def normalize_openalex_id(openalex_id: str | None) -> str | None:
    if not openalex_id:
        return None
    
    return openalex_id.rstrip("/").split("/")[-1]

# --------- NORMALIZE AUTHOR OPENALEX TUPLE ----------

def normalize_author(author: dict, batch_file: Path, batch: int) -> dict:
    normalized_author = copy.deepcopy(author)
    
    # Add clean work Id (the final part of the URL)
    normalized_author["author_openalex_id"] = normalize_openalex_id(author.get("id"))
    
    # Add preprocessing metadata, 
    # making each JSONL line self-contained, independent and easier to debug
    normalized_author["_preprocessing"] = {
        "batch_file": batch_file.name,
        "batch_number": batch
    }
    
    return normalized_author
    

# --------- BUILD AUTHORS GLOBAL JSONL FILE  ---------

def build_authors_jsonl_file() -> None:
    PROCESSED_AUTHORS_DIR.mkdir(parents=True, exist_ok=True)
    
    seen_ids = set()
    total_raw = 0
    total_duplicates = 0
    total_written = 0
    
    with open(AUTHORS_JSONL_FILE, "w", encoding="utf-8") as output:
        for batch_file in sorted(RAW_AUTHORS_DIR.glob("*.json")):
            
            with open(batch_file, "r", encoding="utf-8") as input:
                batch = json.load(input)
                batch_number = batch.get("batch_number")
                authors = (batch.get("response") or {}).get("results") or []
                
                for author in authors:
                    total_raw += 1
                    
                    author_id = author.get("id")
                    if not author_id:
                        continue
                    
                    normalized_openalex_id = normalize_openalex_id(author_id) 
                    if normalized_openalex_id in seen_ids:
                        total_duplicates += 1
                        continue
                    
                    seen_ids.add(normalized_openalex_id)
                    
                    normalized_author = normalize_author(author, batch_file, batch_number)
                    
                    output.write(
                        json.dumps(normalized_author, ensure_ascii=False, separators=(",", ":"))
                        + "\n"
                    )
                    
                    total_written += 1
        
        logger.info(f"Authors: raw={total_raw}, written={total_written}, duplicates={total_duplicates}")
        logger.info(f"Global authors JSONL written to {AUTHORS_JSONL_FILE}")
                

# --------- MAIN PREPROCESSING METHOD ---------

def main() -> None:
    global logger 
    logger = get_logger(name="preprocess_openalex", log_file=LOG_FILE)
    
    build_authors_jsonl_file()

    
if __name__ == "__main__":
    main()