import requests
from requests.exceptions import RequestException
import json
import logging
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from utils.logging_utils import get_logger

# Load environmental variables and OpenAlex api key
load_dotenv()
API_KEY = os.getenv("OPENALEX_API_KEY")

# OpenAlex's directory and subdirectory paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
TOPICS_DIR = RAW_DIR / "topics" # for the raw retrieved JSON topics
WORKS_DIR = RAW_DIR / "works" # for the raw retrieved JSON works
CHECKPOINT_DIR = BASE_DIR / "checkpoints"
LOG_DIR = BASE_DIR / "logs"

# Basic filepaths in those subdirectories
TOPICS_FILE = TOPICS_DIR / "fetch_openalex_topics.json"
CHECKPOINT_FILE = CHECKPOINT_DIR / "fetch_openalex_works_checkpoints.json"
LOG_FILE = LOG_DIR / "fetch_openalex_works.log"

logger = None

# OpenAlex API Base URLs and Query Parameters
TOPICS_URL = "https://api.openalex.org/topics"
WORKS_URL = "https://api.openalex.org/works"
PER_PAGE = "100"

# Allowing 20 requests/second, a safe range way below OpenAlex's 100 requests/second rate limit
REQUEST_SLEEP_SECONDS = 0.05 

# The paper-fetching plan for each topic is:
# 70% (7000) of the papers will be the most cited papers
# 20% (2000) of the papers will be the most recent papers
# 10% (1000) of the papers will be be combination of the most cited and most recent (past 2020) papers 
FETCH_BUCKETS = [
    { "name": "most_cited", "num_batches": 70, "sort": "cited_by_count:desc", "filter": None },
    { "name": "most_recent", "num_batches": 20, "sort": "publication_date:desc", "filter": None },
    { "name": "most_recent_cited", "num_batches": 10, "sort": "cited_by_count:desc", "filter": "from_publication_date:2020-01-01" }
]

# Setup the OpenAlex's required subdirectories for API ingestion
def setup_directories() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    TOPICS_DIR.mkdir(parents=True, exist_ok=True)
    WORKS_DIR.mkdir(parents=True, exist_ok=True)
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

# ---------- PROCESSING UTILITIES ----------

# Strip any trailing "/" and split URL based on "/" separators. The last list element is the id.
def get_openalex_id(openalex_url: str) -> str:
    return openalex_url.rstrip("/").split("/")[-1] 

# Build the request's filter query parameter by joining the filter options with ","
def build_filter(topic_id: str, extra_filter: str | None = None) -> str:
    filters = [f"topics.id:{topic_id}"]
    if extra_filter:
        filters.append(extra_filter)
        
    return ",".join(filters)
    
# ---------- CHECKPOINT FUNCTIONS ----------

# Load the process' checkpoint, if the checkpoint file exists
def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
        
    return { "completed": {} }

# Save the process' checkpoint
def save_checkpoint(checkpoint: dict) -> None:
    # Initially storing new checkpoint to temporary file,
    temp_file = CHECKPOINT_FILE.with_suffix(".tmp")
    
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, indent=2, ensure_ascii=False)
    
    # Using Atomic Replacement to ensure the checkpoint is correctly transfered from .tmp to the .json file
    temp_file.replace(CHECKPOINT_FILE)


# --------- GET REQUEST ----------

# Performing a GET Request to the provided url with the associated query parameters
def request_json(url: str, params: dict) -> dict:
    for attempt in range(1,5):
        try:
            response = requests.get(url=url, params=params)
            
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
        except RequestException as e:
            logger.warning("Request attempted %s failed: %s", attempt, e)
            time.sleep(5 * attempt)
    
    # If all 4 attempts fail, the request ultimately fails
    raise RuntimeError(f"Request failed after retries. URL={url}, params={params}")
            

# ---------- FETCH DATA - TOPICS ----------

# Fetch the top 100 most popular topics in the OpenAlex dataset, based on the total number of papers
def fetch_top_topics() -> list[dict]:
    if TOPICS_FILE.exists():
        logger.info("Loading cached top 100 topics from %s", TOPICS_FILE)
        with open(TOPICS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
        
    logger.info("Fetching the top 100 topics from OpenAlex")
    
    # Query parameters for the topics endpoint and api key for authorization
    params = { "per_page": "100", "sort": "works_count:desc", "api_key": API_KEY }
    
    data = request_json(TOPICS_URL, params)
    topics = data["results"]
    
    with open(TOPICS_FILE, "w", encoding="utf-8") as f:
        json.dump(topics, f, ensure_ascii=False, indent=2)
        
    logger.info("Saved top 100 topics to %s", TOPICS_FILE)
    return topics
        
# --------- FETCH DATA - WORKS ---------

# --------- Get the current cursor ---------
def get_resume_cursor(checkpoint: dict, topic_id: str, bucket_name: str, batch_number: int) -> str:
    if batch_number == 1:
        return "*"
    
    # Accessing the previous batch checkpoint
    previous = (
        checkpoint
        .get("completed", {})
        .get(topic_id, {})
        .get(bucket_name, {})
        .get(str(batch_number - 1))
    )
    
    # And retrieving its next cursor that points to the current batch of works
    if previous and previous.get("next_cursor"):
        return previous.get("next_cursor")
    
    return "*"
    
    
# --------- Save raw batch in JSON file ---------
def save_raw_batch(topic_id: str, bucket_name: str, batch_number: int, 
                   response_data: dict, request_params: dict) -> Path:
    
    # Constructing the directory path for the current batch of papers
    bucket_dir = WORKS_DIR / topic_id / bucket_name
    bucket_dir.mkdir(parents=True, exist_ok=True)
    
    # Constructing the file which will store the retrieved batch of works
    output_file = bucket_dir / f"batch_{batch_number:04d}.json"
    
    # Contents of that file
    file_content = {
        "topic_id": topic_id,
        "bucket": bucket_name,
        "batch_number": batch_number,
        "request_params": request_params,
        "response": response_data,
    }
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(file_content, f, ensure_ascii=False, indent=2)
        
    return output_file

# --------- Update checkpoint object ---------
def mark_batch_complete(checkpoint: dict, topic_id: str, bucket_name: str, batch_number: int,
                        next_cursor: str, output_file: str) -> None:
    
    # Ensure nested keys exist, before we modify the checkpoint dictionary
    checkpoint.setdefault("completed", {})
    checkpoint["completed"].setdefault(topic_id, {})
    checkpoint["completed"][topic_id].setdefault(bucket_name, {})
    
    checkpoint["completed"][topic_id][bucket_name][str(batch_number)] = {
        "done": True,
        "next_cursor": next_cursor,
        "output_file": output_file
    }
    
    save_checkpoint(checkpoint)

# --------- Main fetch method ---------
# For a bucket type (most_cited, most_recent, most_recent_cited), 
# we retrieve its assigned number of batches of 100 works(papers) each
def fetch_bucket_for_topic(topic: str, bucket: dict, checkpoint: dict) -> None:
    topic_id = get_openalex_id(topic["id"])
    bucket_name=bucket["name"]
    
    logger.info("Starting topic=%s bucket=%s display_name=%s", topic_id, bucket_name, topic.get("display_name"))
    
    # Initialize the cursor for every topic
    cursor = "*"
    for batch_number in range(1, bucket["num_batches"] + 1):
        
        # Retrieving checkpoint information about the current batch of papers
        current_batch_checkpoint = (
            checkpoint
            .get("completed", {})
            .get(topic_id, {})
            .get(bucket_name, {})
            .get(str(batch_number), {})
        )
        
        # If there's a retrieved batch and its retrieval is complete,
        # Skip it and continue with the next back, denoted by the checkpoint's next cursor
        if current_batch_checkpoint and current_batch_checkpoint.get("done"):
            logger.info("Skipping completed topic=%s bucket=%s batch=%s", topic_id, bucket_name, batch_number)
            cursor = current_batch_checkpoint.get("next_cursor") or cursor
            continue
        
        if batch_number > 1:
            cursor = get_resume_cursor(checkpoint, topic_id, bucket_name, batch_number)
        
        # Defining query parameters for current batch query
        params = { 
            "per_page": PER_PAGE, 
            "filter": build_filter(topic_id, bucket["filter"]), 
            "sort": bucket["sort"], 
            "cursor": cursor, 
            "api_key": API_KEY 
        }
        
        logger.info("Fetching topic=%s bucket=%s batch=%s", topic_id, bucket_name, batch_number)
        
        data = request_json(WORKS_URL, params=params)
        results = data.get("results", [])
        next_cursor = data.get("meta", {}).get("next_cursor")
        
        # Save batch of retrieved works (papers) to a dedicated JSON file
        output_file = save_raw_batch(topic_id, bucket_name, batch_number, data, params)
        
        # Save the progress by marking the newly-stored batch as complete in the checkpoint object dictionary
        mark_batch_complete(checkpoint, topic_id, bucket_name, batch_number, next_cursor, str(output_file))
        
        logger.info("Saved topic=%s bucket=%s batch=%s records=%s file=%s", topic_id, bucket_name, batch_number, len(results), output_file)
        
        # If we've finished the papers for the current topic (absence of next cursor or no current results) 
        if not next_cursor or len(results) == 0:
            logger.info("No more results for topic=%s bucket=%s after batch=%s", topic_id, bucket_name, batch_number)
            break
            
        # Moving to the next batch of papers
        cursor = next_cursor
        time.sleep(REQUEST_SLEEP_SECONDS)
        



def main():
    # We verify the existence of the API key before hitting the API endpoints
    if not API_KEY:
        raise RuntimeError("OPENALEX API KEY is missing.")
    
    # Setting up subdirectory structures 
    setup_directories()
    
    # Setting up logger for this module, so that it can be used by all functions
    global logger
    logger = get_logger(name="fetch_openalex", log_file=LOG_FILE)
    logger.info("Starting OpenAlex fetch data pipeline.")
    checkpoint = load_checkpoint()
    
    # Fetching the top 100 most popular topics
    topics = fetch_top_topics()
    
    # For each topic, we retrieve each bucket of paper
    for topic in topics:
        topic_id = get_openalex_id(topic["id"])
        logger.info("Processing topic=%s display_name=%s works_count=%s", topic_id, topic["display_name"], topic["works_count"])
        
        for bucket in FETCH_BUCKETS:
            fetch_bucket_for_topic(topic=topic, bucket=bucket, checkpoint=checkpoint)
            
    logger.info("Finished OpenAlex fetch data pipeline.")
    
    
if __name__ == "__main__":
    main()