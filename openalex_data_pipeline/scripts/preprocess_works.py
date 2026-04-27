import json
import copy
from pathlib import Path
from utils.logging_utils import get_logger

# OpenAlex's directory and subdirectory paths
BASE_DIR = Path(__file__).parent.parent
RAW_WORKS_DIR = BASE_DIR / "data/raw/works"
LOG_DIR = BASE_DIR / "logs"

PROCESSED_WORKS_DIR = BASE_DIR / "data/processed/works"
TOPIC_JSONL_DIR = PROCESSED_WORKS_DIR / "per_topic"
GLOBAL_DIR = PROCESSED_WORKS_DIR / "global"

GLOBAL_JSONL_FILE = GLOBAL_DIR / "works.jsonl"

LOG_FILE = LOG_DIR / "preprocess_openalex_works.log"
logger = None


# ---------- PROCESSING UTILITIES ----------

# Strip any trailing "/" and split URL based on "/" separators. The last list element is the id.
def get_openalex_work_id(openalex_url: str) -> str:
    return openalex_url.rstrip("/").split("/")[-1] 

# Extract a topic's id from the URL Path value
def get_openalex_topic_id(topic_path: Path) -> str:
    return str(topic_path).rstrip("\\").split("\\")[-1]


# --------- RECONSTRUCT ABSTRACT ----------

# Reconstruct abstract from abstract inverted index
def reconstruct_abstract(abstract_inverted_index: dict | None) -> str | None:
    # The Index doesn't exist for all papers
    if not abstract_inverted_index:
        return None
    
    words_with_positions = []
    
    # The inverted index consists of dictionaries of words and all positions that word appears in
    for word, positions in abstract_inverted_index.items():
        for position in positions:
            words_with_positions.append((position, word))
    
    # Sort position-word pairs in ascending order of positions
    words_with_positions.sort(key=lambda x: x[0])
            
    # Joining all ordered words in a cohesive abstract text
    return " ".join(word for _, word in words_with_positions)

# --------- NORMALIZE WORK TUPLES ---------

def normalize_work(work: dict, topic_id: str, bucket: str, batch_file: Path, batch: int, request_params: dict, response_meta: dict) -> dict:
    
    # Copying the current work record in the normalized tuple,
    normalized_work = copy.deepcopy(work)
    
    # Add clean work Id (the final part of the URL)
    normalized_work["work_openalex_id"] = get_openalex_work_id(work.get("id"))
    # Add the reconstructed abstract text
    normalized_work["abstract_text"] = reconstruct_abstract(work.get("abstract_inverted_index"))
    
    # Add preprocessing/request/response metadata, 
    # making each JSONL line self-contained, independent and easier to debug
    normalized_work["_preprocessing"] = {
        "topic_id": topic_id,
        "bucket": bucket,
        "batch_file": batch_file.name,
        "batch_number": batch
    }
    normalized_work["_request_params"] = request_params
    normalized_work["_response_meta"] = response_meta
    
    return normalized_work


# --------- BUILD JSONL FILE FOR EACH TOPIC ---------

# Generator that retrieves the topics,
# ensuring each topic is a directory and not a file (precautionary check)
def iter_topics_dir(topics_dir):
    for topic in sorted(topics_dir.iterdir()):
        if topic.is_dir():
            yield topic   
            
# Generator that returns pairs of bucket types (most cited, most recent, most recent & cited),
# and batch files
def iter_batch_files(topic_dir: Path):
    for bucket_dir in topic_dir.iterdir():
        if not bucket_dir.is_dir():
            continue 
    
        bucket = bucket_dir.name
        for batch_file in sorted(bucket_dir.glob("*.json")):
            yield bucket, batch_file
        
        
# Builds the individual JSONL files for each topic
def build_topic_jsonl(topic_dir: Path) -> Path:
    topic_id = topic_dir.name
    output_file = PROCESSED_WORKS_DIR / f"per_topic/{topic_dir.name}.jsonl"
    
    # Set to keep track of processed ids, used for deduplication within the same topic
    seen_topic_ids = set()
    
    # Log metrics about papers
    total_raw = 0
    total_duplicates = 0
    total_written = 0
    
    # We open the output .jsonl file
    """with open(output_file, "w", encoding="utf-8") as output:
        
        # We extract the works records from each batch file of each bucket type
        for bucket, batch_file in iter_batch_files(topic_dir):
            with open(batch_file, "r", encoding="utf-8") as input:
                batch = json.load(input)
            
            batch_topic_id = batch.get("topic_id") or topic_id
            batch_bucket = batch.get("bucket") or bucket
            batch_number = batch.get("batch_number")
            request_params = batch.get("request_params")
            response = batch.get("response") or {}
            response_meta = response.get("meta") or {}
            works = response.get("results") or []
            
            for work in works:
                total_raw += 1
                
                # If work record doesn't have an id, skip it
                work_id = work.get("id")
                if not work_id:
                    continue
                
                # if work record has already been processed, skip it
                if work_id in seen_topic_ids:
                    total_duplicates += 1
                    continue
                
                # Add work record to visited records, normalize it, and write it to the output JSONL file
                seen_topic_ids.add(work_id)
                normalized_work = normalize_work(work, batch_topic_id, batch_bucket, batch_file, batch_number, request_params, response_meta)
                output.write(json.dumps(normalized_work, ensure_ascii=False, separators=(",", ":")) + "\n")
                
                total_written += 1
                
        logger.info(f"{topic_id}: raw={total_raw}, written={total_written}, duplicates={total_duplicates}")
        """
    return output_file
    
        
# Main function that sets up the process of building the separate JSONL files for each topic
def build_topics_jsonl_files() -> list[Path]:
    TOPIC_JSONL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Also, fetch the new file's name and store it in a list
    topic_files = []
    for topic_id in iter_topics_dir(RAW_WORKS_DIR):
        topic_file = build_topic_jsonl(topic_id)
        topic_files.append(topic_file)
        
    return topic_files


# --------- BUILD GLOBAL JSONL & PARQUET FILE FOR ALL TOPICS ---------

# Build global .jsonl file
def build_global_topics_jsonl_file(topic_files: list[Path]) -> None:
    GLOBAL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Set to keep track of visited work records, used in deduplication
    seen_global_ids = set()
    
    # Log metrics
    total_raw = 0
    total_duplicates = 0
    total_written = 0
    
    with open(GLOBAL_JSONL_FILE, "w", encoding="utf-8") as output:
        
        for topic_file in sorted(topic_files):
            with open(topic_file, "r", encoding="utf-8") as input:
                for line in input:
                    total_raw += 1
                    
                    work = json.loads(line)
                    
                    # If work record doesn't have an id, skip it
                    work_id = work.get("id")
                    if not work_id:
                        continue
                    
                    # if work record has already been processed, skip it
                    if work_id in seen_global_ids:
                        total_duplicates += 1
                        continue
                    
                    # Add work record to visited records, and write it to the global output JSONL file
                    seen_global_ids.add(work_id)
                    output.write(line + "\n")
                    total_written += 1
                    
        logger.info(f"Global: raw={total_raw}, written={total_written}, duplicates={total_duplicates}")
        logger.info(f"Global JSONL written to {GLOBAL_JSONL_FILE}")
                    
    

def main() -> None:
    global logger
    logger = get_logger(name="preprocess_openalex", log_file=LOG_FILE)
    
    topic_jsonl_files = build_topics_jsonl_files()
    build_global_topics_jsonl_file(topic_jsonl_files)
    
    

if __name__ == "__main__":
    main()