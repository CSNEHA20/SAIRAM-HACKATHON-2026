import os

# Enable the deterministic offline demo loop for tests so the suite runs without a real API key.
os.environ["OFFLINE_DEMO_MODE"] = "true"

import pytest
import pytest_asyncio
from pathlib import Path
from db.connection import DatabaseManager, get_db_path

@pytest.fixture
def test_db_path():
    path = get_db_path()
    assert os.path.exists(path), f"Database file does not exist at {path}"
    return path
