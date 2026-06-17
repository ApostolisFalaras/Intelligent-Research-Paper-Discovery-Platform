
import os
import random
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from dataclasses import dataclass
import psycopg2
from psycopg2.extras import execute_values, Json
from psycopg2.extensions import cursor
from pathlib import Path
from scripts.utils.logging_utils import get_logger

logger = None

BASE_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "create_test_users.loh"

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_PORT = os.getenv("DB_PORT")

SEED = 42
random.seed(SEED)

VIEWS_PER_USER = 100
SAVES_PER_USER = 10

# Placeholder emails & hashed password for all users
DEMO_EMAIL_DOMAIN = "demo-recs.local"
DEFAULT_PASSWORD_HASH = "$2b$10$syntheticRecommendationDemoHashNotForLogin"

# Folder metadata feature values for variability of folders
FOLDER_COLORS = ["blue", "green", "purple", "orange", "red", "gray"]
FOLDER_ICONS = ["book", "bookmark", "folder", "star", "archive"]

# Defining user communities based on the most popular fields in the current instance of the database
# 40 Users in total
USER_COMMUNITIES = [
    {"field": "Social Sciences", "user_count": 8},
    {"field": "Physics and Astronomy", "user_count": 7},
    {"field": "Agricultural and Biological Sciences", "user_count": 7},
    {"field": "Engineering", "user_count": 6},
    {"field": "Medicine", "user_count": 6},
    {"field": "Computer Science", "user_count": 6}
]

# Search templates used to model queries in the user_search_history tables 
SEARCH_TEMPLATES = [
    "{term}",
    "{term}",
    "{term}",
    "{term}",
    "{term} review",
    "{term} survey",
    "recent {term} papers",
    "{term} methods",
]

# Python generates constructor __init__ automatically
@dataclass
class Persona:
    field: str
    main_subfield: str
    secondary_subfield: str
    minor_subfield: str | None
    

# ---------- BUILD USER PERSONAS ----------

# Fetch a specified amount of the most popular subfields of a particular field
def fetch_top_sufields(cur: cursor, field: str, limit: int = 8) -> list[str]:
    cur.execute(
        """
        SELECT primary_subfield_display_name
        FROM papers
        WHERE primary_field_display_name = %s AND primary_subfield_display_name IS NOT NULL
        GROUP BY primary_subfield_display_name
        ORDER BY COUNT(*) DESC
        LIMIT %s;
        """,
        (field, limit)
    )
    
    return [row[0] for row in cur.fetchall()]

# Build user personas based on the current field and the field's top subfields
# through circular assignment of main, secondary, and minor subfields
def build_user_persona(cur: cursor) -> list[Persona]:
    personas: list[Persona] = []
    
    for community in USER_COMMUNITIES:
        field = community.get("field")
        user_count = community.get("user_count")
        subfields = fetch_top_sufields(cur, field, limit=max(8, user_count+2))
        
        if len(subfields) < 2:
            raise RuntimeError(f"Not enough subfields found for analysis: {field!r}")
        
        for i in range(user_count):
            main = subfields[i % len(subfields)]
            secondary = subfields[(i + 1) % len(subfields)]
            minor = subfields[(i + 2) % len(subfields)]
            personas.append(Persona(field, main, secondary, minor))
            
    return personas
            

# ---------- PAPER VIEWS ASSIGNMENT PER USER ----------

# Retrieve a random sample of papers based on a specific field
def sample_papers(cur: cursor, field: str, limit: int) -> list[int]:
    cur.execute(
        """
        SELECT id
        FROM papers
        WHERE primary_subfield_display_name = %s
        ORDER BY RANDOM()
        LIMIT %s;
        """,
        (field, limit)
    )
    
    return [row[0] for row in cur.fetchall()]

# Assign 100 viewed papers to a persona following the 70/20/10 rule: 
# main subfield --> 70 papers
# secondary subfield --> 20 papers
# minor subfield --> 10 papers
def build_viewed_papers_for_persona(cur: cursor, persona: Persona) -> list[int]:
    main_n = 70
    secondary_n = 20
    minor_n = 10 if persona.minor_subfield else 0
    
    paper_ids: list[int] = []
    
    paper_ids.extend(sample_papers(cur, persona.main_subfield, main_n))
    paper_ids.extend(sample_papers(cur, persona.secondary_subfield, secondary_n))
    
    if persona.minor_subfield:
        paper_ids.extend(sample_papers(cur, persona.minor_subfield, minor_n))
        
    # Deduplication
    paper_ids = list(dict.fromkeys(paper_ids))
    
    # If after deduplication, we have less than 100 papers
    # We fetch the remaining using the primary field and not the subfields
    if len(paper_ids) < VIEWS_PER_USER:
        needed_n = VIEWS_PER_USER - len(paper_ids)
        cur.execute(
            """
            SELECT id
            FROM papers
            WHERE primary_field_display_name = %s AND id <> ALL(%s)
            ORDER BY RANDOM()
            LIMIT %s;
            """,
            (persona.field, paper_ids or [-1], needed_n)
        )
        
    paper_ids.extend([row[0] for row in cur.fetchall()])
    
    return paper_ids[:VIEWS_PER_USER]
        

# ---------- INSERTION FUNCTIONS ----------
    
# Insert a user record to the "users" table
def insert_user(cur: cursor, index: int, persona: Persona) -> int:
    username = f"demo_recs_user_{index:02d}"
    email = f"demo_recs_user_{index:02d}@{DEMO_EMAIL_DOMAIN}"
    
    cur.execute(
        """
        INSERT INTO users (
            username, email, password_hash, first_name, last_name, affiliation, role, bio 
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (email) DO UPDATE SET
            username = EXCLUDED.username,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            affiliation = EXCLUDED.affiliation,
            role = EXCLUDED.role,
            bio = EXCLUDED.bio,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id;
        """,
        (
            username, 
            email, 
            DEFAULT_PASSWORD_HASH, 
            "Demo",
            f"User {index:02d}", 
            f"Synthetic {persona.field} Lab",
            "researcher",
            f"Synthetic recommendation-test user interested in {persona.main_subfield}, {persona.secondary_subfield}."
        )
    )
    
    return cur.fetchone()[0]


def insert_interactions(cur: cursor, user_id: int, viewed_papers: list[int], saved_papers: list[int]) -> None:
    now = datetime.now()
    rows = []
    
    for paper_id in viewed_papers:
        is_saved = paper_id in saved_papers
        
        # More views and higher interest score for a saved paper
        view_count = random.randint(3, 8) if is_saved else random.randint(1, 4)
        interest_score = view_count + (5 if is_saved else 0)
        
        # Random initial view and last interaction timestamps
        first_viewed_at = now - timedelta(days=random.randint(1, 120))
        last_interaction_at = first_viewed_at + timedelta(days=random.randint(0, 10))
        
        rows.append((user_id, paper_id, view_count, is_saved, interest_score, first_viewed_at, last_interaction_at))
        
    execute_values(
        cur,
        """
        INSERT INTO user_paper_interactions (
            user_id, paper_id, view_count, is_saved, interest_score,
            first_viewed_at, last_interaction_at
        )
        VALUES %s
        ON CONFLICT (user_id, paper_id) DO UPDATE SET
            view_count = EXCLUDED.view_count,
            is_saved = EXCLUDED.is_saved,
            interest_score = EXCLUDED.interest_score,
            first_viewed_at = EXCLUDED.first_viewed_at,
            last_interaction_at = EXCLUDED.last_interaction_at;
        """,
        rows
    )
    

# Create folder for a particular user
def create_folder(cur: cursor, user_id: int, name: str, summary: str, is_pinned: bool = False) -> int:
    cur.execute(
        """
        INSERT INTO user_folders (
            user_id, name, summary, is_pinned, visibility, color, icon
        )
        VALUES (%s, %s, %s, %s, 'private', %s, %s)
        ON CONFLICT (user_id, name) DO UPDATE SET
            summary = EXCLUDED.summary,
            is_pinned = EXCLUDED.is_pinned,
            updated_at = CURRENT_TIMESTAMP
        RETURNING id;
        """,
        (user_id, name, summary, is_pinned, random.choice(FOLDER_COLORS), random.choice(FOLDER_ICONS))
    )
    
    return cur.fetchone()[0]


def insert_folder_and_saved_papers(cur: cursor, user_id: int, persona: Persona, saved_papers: list[int]) -> None:
    if not saved_papers:
        return
    
    # Assiming 1 or 2 folder per user for simplicity of simulation data 
    folder_count = random.choices([1,2], weights=[70,30], k=1)[0]
    
    folders = [
        create_folder(
            cur, 
            user_id, 
            f"{persona.main_subfield} Reading List",
            f"Saved papers related to {persona.main_subfield}.",
            is_pinned=True)
    ]
    
    if folder_count == 2:
        folders.append(
            create_folder(
                cur,
                user_id,
                f"{persona.secondary_subfield} Papers",
                f"Saved papers related to {persona.secondary_subfield}.",
                is_pinned=False,
            )
        )
        
    rows = []
    for i, paper_id in enumerate(saved_papers):
        
        # Assigning papers in alternative folders (if there are 2 folders)
        folder_id = folders[i % len(folders)]
        rows.append((folder_id, paper_id))
        
    execute_values(
        cur,
        """
        INSERT INTO user_folder_papers (folder_id, paper_id)
        VALUES %s
        ON CONFLICT (folder_id, paper_id) DO NOTHING;
        """,
        rows
    )
        
    # Update paper count of folders after papers have been saved in them
    cur.execute(
        """
        UPDATE user_folders uf
        SET paper_count = sub.count
        FROM (
            SELECT folder_id, COUNT(*) AS count
            FROM user_folder_papers
            WHERE folder_id = ANY(%s)
            GROUP BY folder_id
        ) sub
        WHERE uf.id = sub.folder_id;
        """,
        (folders,)
    )
    

# Insert user search history records
def insert_search_history(cur: cursor, user_id: int, persona: Persona) -> None:
    terms = [ persona.main_subfield, persona.secondary_subfield ]
    
    if persona.minor_subfield:
        terms.append(persona.minor_subfield)
        
    search_count = random.randint(8, 18)
    rows = []
    
    for _ in range(search_count):
        term = random.choice(terms)
        
        # Since the search queries are a weaker recommendation signal,
        # We use the simple search templates defined above,
        query = random.choice(SEARCH_TEMPLATES).format(term=term).lower()
        
        # And the default search filters
        filters = {
            "fromYear": None,
            "toYear": None,
            "language": None,
            "paperType": None,
            "minCitations": None,
            "topicId": None,
            "authorName": None,
            "isOpenAccess": True,
            "hasContentPDF": None,
            "isRetracted": False,
            "sort": "relevance"
        }
        
        result_count = random.randint(20, 500)
        
        created_at = datetime.now(timezone.utc) - timedelta(days=random.randint(1, 120))
        
        rows.append((user_id, query, Json(filters), result_count, created_at))
        
    execute_values(
        cur,
        """
        INSERT INTO user_search_history (
            user_id, query, filters, result_count, created_at
        )
        VALUES %s;
        """,
        rows
    )
        

# Global-level interaction metrics for each paper
def update_paper_metrics(cur: cursor) -> None:
    cur.execute(
        """
        WITH interaction_counts AS (
            SELECT
                paper_id,
                SUM(view_count)::integer AS views,
                COUNT(*) FILTER (WHERE is_saved)::integer AS saves
            FROM user_paper_interactions
            GROUP BY paper_id
        )
        INSERT INTO paper_metrics (
            paper_id, view_count, save_count, recommendation_click_count, popularity_score
        )
        SELECT
            paper_id,
            views,
            saves,
            0,
            0
        FROM interaction_counts
        ON CONFLICT (paper_id) DO UPDATE SET
            view_count = EXCLUDED.view_count,
            save_count = EXCLUDED.save_count,
            updated_at = CURRENT_TIMESTAMP;
        """
    )
    

# Mark user recommendation cache as stale/dirty
def mark_recommendation_state(cur: cursor, user_ids: list[int]) -> None:
    rows = [(uid, "synthetic_demo_user_seed", 2) for uid in user_ids]
    
    execute_values(
        cur,
        """
        INSERT INTO recommendation_refresh_queue (user_id, reason, priority)
        VALUES %s
        ON CONFLICT (user_id) DO UPDATE SET
            reason = EXCLUDED.reason,
            priority = EXCLUDED.priority,
            requested_at = CURRENT_TIMESTAMP,
            processed_at = NULL;
        """,
        rows
    ) 


# ---------- RESET USERS/RECOMMENDATIONS ----------

# Delete existing users and their history/folder/paper interaction metadata
# For reproducibility of the synthetic user dataset creation process
def delete_existing_user_dataset(cur: cursor) -> None:
    cur.execute(
        """
        DELETE FROM users 
        WHERE email LIKE %s;
        """,
        (f"%@{DEMO_EMAIL_DOMAIN}",)
    )



def main() -> None:
    global logger
    logger = get_logger(name="create_test_users", log_file=LOG_FILE)
    
    conn = None
    cur = None
    
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            host=DB_HOST,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        # Clean the user/recommendation portion of the dataset before resetting
        delete_existing_user_dataset(cur)
        
        logger.info("Creation of test users begins:")
        
        personas = build_user_persona(cur)
        created_user_ids: list[int] = []
        
        for index, persona in enumerate(personas, start=1):
            user_id = insert_user(cur, index, persona)
            viewed_papers = build_viewed_papers_for_persona(cur, persona)
            
            saved_papers = set(random.sample(viewed_papers, SAVES_PER_USER))
            
            insert_interactions(cur, user_id, viewed_papers, saved_papers)
            insert_folder_and_saved_papers(cur, user_id, persona, list(saved_papers))
            insert_search_history(cur, user_id, persona)
        
            created_user_ids.append(user_id)
            logger.info(f"User {index}/40, interactions, folders, search history created successfully")
            
        update_paper_metrics(cur)
        mark_recommendation_state(cur, created_user_ids)
        
        conn.commit()
        logger.info(f"Done. Created {len(created_user_ids)} synthetic recommendation users.")
        
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
    main()