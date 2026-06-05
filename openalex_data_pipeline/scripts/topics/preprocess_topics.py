import json
import copy
from pathlib import Path
from typing import Generator
from scripts.utils.logging_utils import get_logger

BASE_DIR = Path(__file__).resolve().parents[2]
RAW_TOPICS_DIR = BASE_DIR / "data/raw/topics"
RAW_TOPICS_BATCHES_DIR = RAW_TOPICS_DIR / "batches"
PROCESSED_TOPICS_DIR = BASE_DIR / "data/processed/topics"
LOG_DIR = BASE_DIR / "logs"

RAW_TOPICS_FILE = RAW_TOPICS_DIR / "fetch_openalex_topics.json"
PROCESSED_TOPICS_FILE = PROCESSED_TOPICS_DIR / "topics.jsonl"
LOG_FILE = LOG_DIR / "preprocess_openalex_topics.log"

logger = None



# ---------- PROCESSING UTILITIES ----------

# Strip any trailing "/" and split URL based on "/" separators. The last list element is the id.
def get_openalex_topic_id(openalex_url: str | None) -> str | None:
    if not openalex_url:
        return None
    
    return openalex_url.rstrip("/").split("/")[-1] 


# ---------- NORMALIZE TOPIC TUPLE -----------

def normalize_topic(topic: dict, batch_file: Path, batch_number: int) -> dict:
    
    normalized_topic = copy.deepcopy(topic)
    
    # Add clean work Id (the final part of the URL)
    normalized_topic["topic_openalex_id"] = get_openalex_topic_id(topic.get("id"))
    
    # Add preprocessing metadata, 
    # making each JSONL line self-contained, independent and easier to debug
    normalized_topic["_preprocessing"] = {
        "batch_file": batch_file.name,
        "batch_number": batch_number
    }
    
    return normalized_topic

# ---------- GENERATORS FOR YIELDING TOP 100 TOPIC TUPLES AND AUTHOR-RELATED TOPIC TUPLES ----------

def iter_top_100_topics() -> Generator[tuple[dict, Path, None], None, None]:
    if not RAW_TOPICS_FILE.exists():
        return
    
    with open(RAW_TOPICS_FILE, "r", encoding="utf-8") as f:
        topics = json.load(f)
        
    for topic in topics:
        yield topic, RAW_TOPICS_FILE, None
        

def iter_batch_topics() -> Generator[tuple[dict, Path, int], None, None]:
    
    for batch_file in sorted(RAW_TOPICS_BATCHES_DIR.glob("*.json")):
        with open(batch_file, "r", encoding="utf-8") as f:
            batch = json.load(f)
            
        batch_number = batch.get("batch_number")
        topics = (batch.get("response") or {}).get("results") or []
        
        for topic in topics:
            yield topic, batch_file, batch_number  


# ---------- CREATE TOPICS JSON FILE ----------

def build_topics_jsonl_file() -> None:
    PROCESSED_TOPICS_DIR.mkdir(parents=True, exist_ok=True)
    
    seen_ids = set()
    total_raw = 0
    total_duplicates = 0
    total_written = 0
    
    with open(PROCESSED_TOPICS_FILE, "w", encoding="utf-8") as output:
        for topic, batch_file, batch_number in list(iter_top_100_topics()) + list(iter_batch_topics()):
            total_raw += 1
            
            topic_id = get_openalex_topic_id(topic.get("id"))
            if not topic_id:
                continue
            
            if topic_id in seen_ids:
                total_duplicates += 1
                continue
            
            seen_ids.add(topic_id)
            normalized_topic = normalize_topic(topic, batch_file, batch_number)
            
            output.write(
                json.dumps(normalized_topic, ensure_ascii=False, separators=(",", ":")) + "\n"
            )
            
            total_written += 1
    
    logger.info(
        "Topics: raw=%s, written=%s, duplicates=%s",
        total_raw,
        total_written,
        total_duplicates
    )
    
    logger.info("Global topics JSONL written to %s", PROCESSED_TOPICS_FILE)
            
            

def main() -> None:
    global logger
    logger = get_logger(name="preprocess_openalex", log_file=LOG_FILE)
    
    build_topics_jsonl_file()
    

if __name__ == "__main__":
    main()