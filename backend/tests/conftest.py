import os
import pytest
import pytest_asyncio
from pathlib import Path
from db.connection import DatabaseManager, get_db_path

@pytest.fixture
def test_db_path():
    path = get_db_path()
    assert os.path.exists(path), f"Database file does not exist at {path}"
    return path
