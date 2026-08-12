"""
DataFlow AI — Dataset Ingestion Tool
Handles dataset uploads (ZIP, CSV, SQLite) and Kaggle dataset code/URL imports.
"""

import os
import io
import zipfile
import csv
import re
import urllib.request
import sqlite3
from pathlib import Path
from typing import Dict, Any, List

from db.adapters.sqlite import _resolve_db_path

DB_PATH = _resolve_db_path(None)


def sanitize_table_name(name: str) -> str:
    """Sanitize filename to a valid SQLite table name."""
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
    clean = re.sub(r'_+', '_', clean).strip('_')
    return clean or "uploaded_dataset"


async def ingest_csv_bytes(csv_content: bytes, table_name: str) -> Dict[str, Any]:
    """Parse CSV bytes and insert as a table into SQLite database."""
    try:
        table_name = sanitize_table_name(table_name)
        text = csv_content.decode('utf-8', errors='ignore')
        reader = csv.reader(io.StringIO(text))
        headers = next(reader, None)
        if not headers:
            return {"success": False, "error": "CSV file is empty"}

        clean_cols = [sanitize_table_name(h) or f"col_{i}" for i, h in enumerate(headers)]

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Drop existing table if exists
        cursor.execute(f"DROP TABLE IF EXISTS \"{table_name}\"")

        # Create table
        col_defs = ", ".join([f"\"{c}\" TEXT" for c in clean_cols])
        cursor.execute(f"CREATE TABLE \"{table_name}\" ({col_defs})")

        # Insert rows
        rows = [row for row in reader if row]
        if rows:
            placeholders = ", ".join(["?"] * len(clean_cols))
            # Normalize row length
            normalized_rows = [
                row[:len(clean_cols)] + [""] * max(0, len(clean_cols) - len(row))
                for row in rows
            ]
            cursor.executemany(f"INSERT INTO \"{table_name}\" VALUES ({placeholders})", normalized_rows)

        conn.commit()
        conn.close()

        return {
            "success": True,
            "table_name": table_name,
            "rows_inserted": len(rows),
            "columns": clean_cols
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to ingest CSV: {str(e)}"}


async def ingest_zip_bytes(zip_content: bytes) -> Dict[str, Any]:
    """Extract ZIP file and ingest contained CSV/SQLite files."""
    try:
        tables_added = []
        with zipfile.ZipFile(io.BytesIO(zip_content)) as z:
            for filename in z.namelist():
                if filename.startswith('__MACOSX/') or filename.endswith('/'):
                    continue
                if filename.lower().endswith('.csv'):
                    base_name = Path(filename).stem
                    data = z.read(filename)
                    res = await ingest_csv_bytes(data, base_name)
                    if res.get("success"):
                        tables_added.append(res["table_name"])

        return {
            "success": True,
            "tables_added": tables_added,
            "message": f"Successfully ingested {len(tables_added)} table(s) from ZIP archive."
        }
    except Exception as e:
        return {"success": False, "error": f"Failed to ingest ZIP archive: {str(e)}"}


async def download_kaggle_dataset(kaggle_url_or_code: str) -> Dict[str, Any]:
    """
    Import dataset from Kaggle code or dataset URL.
    Supports formats:
    - https://www.kaggle.com/datasets/user/dataset-name
    - kaggle datasets download -d user/dataset-name
    - user/dataset-name
    """
    try:
        # Extract user/dataset-name slug
        match = re.search(r'(?:kaggle\.com/datasets/|download -d\s+|^)([a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+)', kaggle_url_or_code.strip())
        slug = match.group(1) if match else kaggle_url_or_code.strip()
        dataset_name = slug.split('/')[-1]

        # Fetch dataset using direct Kaggle API download endpoint if available or fallback
        download_url = f"https://www.kaggle.com/api/v1/datasets/download/{slug}"
        req = urllib.request.Request(
            download_url,
            headers={"User-Agent": "Mozilla/5.0"}
        )

        with urllib.request.urlopen(req) as response:
            content = response.read()

        if zipfile.is_zipfile(io.BytesIO(content)):
            res = await ingest_zip_bytes(content)
            res["dataset_slug"] = slug
            return res
        else:
            res = await ingest_csv_bytes(content, dataset_name)
            res["dataset_slug"] = slug
            return res
    except Exception as e:
        return {
            "success": False,
            "error": f"Unable to fetch Kaggle dataset '{kaggle_url_or_code}': {str(e)}. Please upload a ZIP/CSV directly."
        }
