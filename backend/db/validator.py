import re
from typing import Tuple

FORBIDDEN_KEYWORDS = {
    "INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER",
    "TRUNCATE", "EXEC", "EXECUTE", "GRANT", "REVOKE", "VACUUM"
}

DEFAULT_LIMIT = 100
MAX_LIMIT = 1000

class SQLValidator:
    """SELECT-only query validator and LIMIT policy enforcer."""
    
    @staticmethod
    def validate_and_format(sql: str) -> Tuple[bool, str]:
        """
        Validates that the SQL is a safe SELECT statement and enforces LIMIT policies.
        Returns:
            (True, formatted_sql) if valid.
            (False, error_message) if invalid.
        """
        if not sql or not sql.strip():
            return False, "SQL query cannot be empty."

        clean_sql = sql.strip().rstrip(";")
        
        # Rule 1: Must start with SELECT (case-insensitive)
        if not re.match(r"^\s*SELECT\b", clean_sql, re.IGNORECASE):
            return False, "Only SELECT queries are allowed for data safety."

        # Rule 2: Check for forbidden mutation keywords
        tokens = re.findall(r"\b[A-Za-z_]+\b", clean_sql.upper())
        for token in tokens:
            if token in FORBIDDEN_KEYWORDS:
                return False, f"Forbidden SQL command detected: {token}. Only read-only queries are permitted."

        # Rule 3 & 4: Limit policy enforcement
        # Check if query already has a LIMIT clause
        limit_match = re.search(r"\bLIMIT\s+(\d+)", clean_sql, re.IGNORECASE)
        if limit_match:
            existing_limit = int(limit_match.group(1))
            if existing_limit > MAX_LIMIT:
                # Cap to MAX_LIMIT
                clean_sql = re.sub(
                    r"\bLIMIT\s+\d+",
                    f"LIMIT {MAX_LIMIT}",
                    clean_sql,
                    flags=re.IGNORECASE
                )
        else:
            # Append DEFAULT_LIMIT
            clean_sql = f"{clean_sql} LIMIT {DEFAULT_LIMIT}"

        return True, clean_sql

sql_validator = SQLValidator()
