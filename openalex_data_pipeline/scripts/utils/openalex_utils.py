def sanitize_params(params: dict) -> dict:
    """Return a copy of OpenAlex request parameters with secrets redacted."""
    safe_params = params.copy()
    
    if "api_key" in safe_params:
        safe_params["api_key"] = "[REDACTED]"
        
    return safe_params