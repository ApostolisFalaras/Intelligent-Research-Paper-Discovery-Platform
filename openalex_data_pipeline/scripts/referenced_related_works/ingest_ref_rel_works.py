from pathlib import Path
import os
from dotenv import load_dotenv
import psycopg2
from scripts.main_works import ingest_works


load_dotenv()
API_KEY = os.getenv("OPENALEX_API_KEY")

DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
REF_WORKS_DIR = RAW_DIR / "referenced_works"
REL_WORKS_DIR = RAW_DIR / "related_works"





# --------- REFERENCED & RELATED PAPERS INGESTION ----------      
def ingest() -> None:
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
        
        cur.execute("SELECT openalex_id FROM papers;")
        openalex_ids = cur.fetchall()
        
        stored_ids_set = set()
        for openalex_id in openalex_ids:
            stored_ids_set.add(openalex_id[0])
        
        print("Current stored ids: ", len(stored_ids_set))
            
        cur.execute("SELECT referenced_work_openalex_id FROM paper_references;")
        referenced_openalex_ids = cur.fetchall()
        
        ref_ids_to_fetch_set = set()
        for ref_openalex_id in referenced_openalex_ids:
            if ref_openalex_id[0] and ref_openalex_id[0] not in stored_ids_set:
                ref_ids_to_fetch_set.add(ref_openalex_id[0])
                
        print("Current referenced ids: ", len(referenced_openalex_ids))
        print("Referenced ids not stored: ", len(ref_ids_to_fetch_set))
        
        cur.execute("SELECT related_work_openalex_id FROM paper_related;")
        related_openalex_ids = cur.fetchall()
        
        rel_ids_to_fetch_set = set()
        for rel_openalex_id in related_openalex_ids:
            if rel_openalex_id[0] and rel_openalex_id[0] not in stored_ids_set:
                rel_ids_to_fetch_set.add(rel_openalex_id[0])
                
        print("Current related ids: ", len(related_openalex_ids))
        print("Related ids not stored: ", len(rel_ids_to_fetch_set))
        
        print("Common referenced-related: ", len(ref_ids_to_fetch_set & rel_ids_to_fetch_set))
        
        unique_rel_ids_to_fetch_set = rel_ids_to_fetch_set - (ref_ids_to_fetch_set & rel_ids_to_fetch_set)
        unique = rel_ids_to_fetch_set | ref_ids_to_fetch_set
        print("Unique papers to be added: ", len(ref_ids_to_fetch_set) + len(unique_rel_ids_to_fetch_set))
        print("Unique papers to be added: ", len(unique))
        
        
    except Exception:
        if conn:
            conn.rollback()
        raise
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
    
if __name__ == "__main__":
    ingest()