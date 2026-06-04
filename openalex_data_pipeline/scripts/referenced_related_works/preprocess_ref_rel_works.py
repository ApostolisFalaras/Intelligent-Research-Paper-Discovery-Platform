import json
import copy
from pathlib import Path
from scripts.utils.logging_utils import get_logger

BASE_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = BASE_DIR / "logs"

REF_REL_DIR = BASE_DIR / "data/raw/referenced_related_works/batches"
PROCESSED_REF_REL_DIR = BASE_DIR / "data/processed/referenced_related_works"

REF_REL_JSON_FILE = PROCESSED_REF_REL_DIR / "ref_rel_works.jsonl"
LOG_FILE = LOG_DIR / "preprocess_ref_rel_works.log"

logger = None

# ---------- PROCESSING UTILITIES ----------

# Strip any trailing "/" and split URL based on "/" separators. The last list element is the id.
def get_openalex_work_id(openalex_url: str) -> str:
    return openalex_url.rstrip("/").split("/")[-1] 


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

def normalize_work(work: dict, batch_file: Path, batch: int) -> dict:
    
    # Copying the current work record in the normalized tuple,
    normalized_work = copy.deepcopy(work)
    
    # Add clean work Id (the final part of the URL)
    normalized_work["work_openalex_id"] = get_openalex_work_id(work.get("id"))
    # Add the reconstructed abstract text
    normalized_work["abstract_text"] = reconstruct_abstract(work.get("abstract_inverted_index"))
    
    # Add preprocessing metadata, 
    # making each JSONL line self-contained, independent and easier to debug
    normalized_work["_preprocessing"] = {
        "batch_file": batch_file.name,
        "batch_number": batch
    }
    
    return normalized_work


def build_global_ref_rel_json_file() -> None:
    PROCESSED_REF_REL_DIR.mkdir(parents=True, exist_ok=True)
    
    seen_ids = set()
    total_raw = 0
    total_duplicates = 0
    total_written = 0
    
    with open(REF_REL_JSON_FILE, "w", encoding="utf-8") as output:
        for batch_file in sorted(REF_REL_DIR.glob("*.json")):
            
            with open(batch_file, "r", encoding="utf-8") as input:
                batch = json.load(input)
                batch_number = batch.get("batch_number")
                works = (batch.get("response") or {}).get("results") or []
                
                for work in works:
                    total_raw += 1
                    
                    work_id = work.get("id")
                    if not work_id:
                        continue
                    
                    normalized_openalex_id = get_openalex_work_id(work_id)
                    if normalized_openalex_id in seen_ids:
                        total_duplicates += 1
                        continue
                    
                    seen_ids.add(normalized_openalex_id)
                    
                    normalized_work = normalize_work(work, batch_file, batch_number)
                    
                    output.write(
                        json.dumps(normalized_work, ensure_ascii=False, separators=(",", ":")) + "\n"
                    )
                    
                    total_written += 1
                        
    logger.info(
        "Referenced/related works: raw=%s, written=%s, duplicates=%s",
        total_raw,
        total_written,
        total_duplicates
    )
    logger.info("Global referenced/related JSONL written to %s", REF_REL_JSON_FILE)
    
            
    
def main() -> None:
    global logger
    logger = get_logger(name="preprocess_openalex", log_file=LOG_FILE)    
    
    build_global_ref_rel_json_file()
    

if __name__ == "__main__":
    main()