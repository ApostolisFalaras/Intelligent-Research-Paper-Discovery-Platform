import json
from pathlib import Path

# --------- UTILITIES FOR NORMALIZING IDS ------------

# For example, a work/paper "https://openalex.org/W2741809807" is normalized to "W2741809807".
# The same principle applies to author, institution, source, topic ids
def normalize_openalex_id(openalex_id: str) -> str:
    if not openalex_id:
        return
    
    prefixes = [
        "https://openalex.org/domains/",
        "https://openalex.org/fields/",
        "https://openalex.org/subfields/",
        "https://openalex.org/keywords/",
        "https://openalex.org/", 
        "http://openalex.org/",
    ]
    
    for prefix in prefixes:
        if openalex_id.startswith(prefix):
            return openalex_id.removeprefix(prefix)
    
    return openalex_id

# This performs the same normalization but for a list of openalex ids,
# which appear in institution's lineage, affiliation's institutions ids, 
# host organization, and host organization lineage
def normalize_openalex_id_list(list_openalex_id: list[str]) -> list[str]:
    if not list_openalex_id:
        return []
    
    prefixes = [
        "https://openalex.org/domains/",
        "https://openalex.org/fields/",
        "https://openalex.org/subfields/",
        "https://openalex.org/keywords/",
        "https://openalex.org/", 
        "http://openalex.org/",
    ]
    
    normalized_id_list = []
    
    for openalex_id in list_openalex_id:
        if not openalex_id:
            continue
        
        matched = False
        
        for prefix in prefixes:
            if openalex_id.startswith(prefix):
                normalized_id_list.append(openalex_id.removeprefix(prefix))
                matched = True
                break
            
        # If the id doesn't match any of the potential prefixes, use it as it is
        if not matched:
            normalized_id_list.append(openalex_id)
                
    return normalized_id_list

# --------- DATASET BATCHES UTILITIES ------------

# Generator that reads and returns a batch of input JSONL rows
def read_jsonl_batch(file: Path, size: int):
    batch = []
    
    with open(file, "r", encoding="utf-8") as f:
        for line in f:
            # If the line is empty skip it
            if not line.strip():
                continue
            
            # Add deserialized dictionary to the batch, and if the batch is full, yield it
            batch.append(json.loads(line))
            if len(batch) >= size:
                yield batch
                batch = []
    
    # Yield any remainining paper rows that didn't fit in a full batch
    if batch:
        yield batch


# --------- DATA VALIDATION UTILITIES ----------

MIN_PUBL_YEAR = 1800
MAX_PUBL_YEAR = 2026

# Validate that the paper publication year is between 1800 and 2026
def has_valid_publication_year(work: dict) -> bool:
    publication_year = work.get("publication_year")
    
    # If publ. year doesn't exist
    if publication_year is None:
        return False
    
    try:
        # Checking if publ. year is a number
        publication_year = int(publication_year)
    except (TypeError, ValueError):
        return False
    
    return MIN_PUBL_YEAR <= publication_year <= MAX_PUBL_YEAR
    
LANGUAGE_NAMES = { 
    'af': 'Afrikaans', 
    'aig': 'Antigua and Barbuda Creole English', 
    'als': 'Swiss German', 
    'ang': 'Old English', 
    'ar': 'Arabic', 
    'arb': 'Standard Arabic', 
    'ast': 'Asturian', 
    'az': 'Azerbaijani', 
    'azb': 'South Azerbaijani', 
    'bar': 'Bavarian', 
    'bcl': 'Central Bikol', 
    'bg': 'Bulgarian', 
    'bh': 'Bihari', 
    'bi': 'Bislama', 
    'bn': 'Bengali', 
    'bpy': 'Bishnupriya Manipuri', 
    'br': 'Breton', 
    'bs': 'Bosnian', 
    'ca': 'Catalan', 
    'cbk': 'Chavacano', 
    'ceb': 'Cebuano', 
    'cjy': 'Jinyu Chinese', 
    'ckb': 'Central Kurdish', 
    'cmn': 'Mandarin Chinese', 
    'cs': 'Czech', 
    'csc': 'Catalan Sign Language', 
    'cy': 'Welsh', 
    'da': 'Danish', 
    'de': 'German', 
    'dsb': 'Lower Sorbian', 
    'el': 'Greek', 
    'en': 'English', 
    'enc': 'Enochian', 
    'enm': 'Middle English', 
    'eo': 'Esperanto', 
    'es': 'Spanish', 
    'et': 'Estonian', 
    'eu': 'Basque', 
    'fa': 'Persian', 
    'fi': 'Finnish', 
    'fr': 'French', 
    'fy': 'West Frisian', 
    'ga': 'Irish', 
    'gd': 'Scottish Gaelic', 
    'gl': 'Galician', 
    'grc': 'Ancient Greek', 
    'gsg': 'German Sign Language', 
    'he': 'Hebrew', 
    'hi': 'Hindi', 
    'hr': 'Croatian', 
    'ht': 'Haitian Creole', 
    'hu': 'Hungarian', 
    'hy': 'Armenian', 
    'ia': 'Interlingua', 
    'id': 'Indonesian', 
    'ie': 'Interlingue', 
    'ilo': 'Ilocano', 
    'io': 'Ido', 
    'is': 'Icelandic', 
    'it': 'Italian', 
    'ja': 'Japanese', 
    'jbo': 'Lojban', 
    'jv': 'Javanese', 
    'ka': 'Georgian', 
    'kaa': 'Karakalpak', 
    'kk': 'Kazakh', 
    'kmr': 'Northern Kurdish', 
    'kn': 'Kannada', 
    'ko': 'Korean', 
    'ku': 'Kurdish', 
    'ky': 'Kyrgyz', 
    'la': 'Latin', 
    'lb': 'Luxembourgish', 
    'li': 'Limburgish', 
    'lmo': 'Lombard', 
    'lt': 'Lithuanian', 
    'lv': 'Latvian', 
    'mg': 'Malagasy', 
    'min': 'Minangkabau', 
    'mis': 'Uncoded Language', 
    'mk': 'Macedonian', 
    'ml': 'Malayalam', 
    'mn': 'Mongolian', 
    'mr': 'Marathi', 
    'ms': 'Malay', 
    'mt': 'Maltese', 
    'mul': 'Multiple Languages', 
    'my': 'Burmese', 
    'nb': 'Norwegian Bokmål', 
    'nds': 'Low German', 
    'ng': 'Ndonga', 
    'nl': 'Dutch', 
    'nn': 'Norwegian Nynorsk', 
    'no': 'Norwegian', 
    'non': 'Old Norse', 
    'nr': 'South Ndebele', 
    'oc': 'Occitan', 
    'ory': 'Odia', 
    'other': 'Other', 
    'pl': 'Polish', 
    'pms': 'Piedmontese', 
    'prm': 'Prasuni', 
    'pt': 'Portuguese', 
    'rm': 'Romansh', 
    'ro': 'Romanian', 
    'ru': 'Russian', 
    'sa': 'Sanskrit', 
    'sco': 'Scots', 
    'se': 'Northern Sami', 
    'sh': 'Serbo-Croatian', 
    'sk': 'Slovak', 
    'sl': 'Slovenian', 
    'sol': 'Solos', 
    'spa': 'Spanish', 
    'sq': 'Albanian', 
    'sr': 'Serbian', 
    'su': 'Sundanese', 
    'sv': 'Swedish', 
    'sw': 'Swahili', 
    'ta': 'Tamil', 
    'tg': 'Tajik', 
    'th': 'Thai', 
    'ti': 'Tigrinya', 
    'tl': 'Tagalog', 
    'tql': 'Toki Pona', 
    'tr': 'Turkish', 
    'tt': 'Tatar', 
    'uk': 'Ukrainian', 
    'uz': 'Uzbek', 
    'vi': 'Vietnamese', 
    'vo': 'Volapük', 
    'wa': 'Walloon', 
    'war': 'Waray', 
    'xx': 'Unknown', 
    'yi': 'Yiddish', 
    'zh': 'Chinese', 
    'zxx': 'No Linguistic Content' 
}

# Normalize language codes to language names
def normalize_language(lang_code: str | None) -> str | None:
    if not lang_code:
        return None
    
    lang_code = lang_code.strip().lower()
    
    return LANGUAGE_NAMES.get(lang_code, lang_code)