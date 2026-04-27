import logging
from pathlib import Path

def get_logger(name: str, log_file: Path) -> logging.Logger:
    logger = logging.getLogger(name)
    
    # If the logger already has handlers attached to it, don't configure it again and return it,
    # Prevents duplicate messages that would be added by multiple attached handlers
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s [%(levelname)s] [%(name)s] %(message)s")
    
    # File handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # Attach handlers to newly-created logger, and return it
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger