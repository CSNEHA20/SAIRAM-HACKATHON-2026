import os
import pytest
import pytest_asyncio
import tempfile

from agent.session_store.memory import MemorySessionBackend
from agent.session_store.sqlite import SQLiteSessionBackend


@pytest_asyncio.fixture
async def sqlite_backend():
    with tempfile.NamedTemporaryFile(suffix=".sqlite", delete=False) as f:
        path = f.name
    backend = SQLiteSessionBackend(db_path=path)
    await backend.initialize()
    yield backend
    await backend.close()
    try:
        os.unlink(path)
    except PermissionError:
        # Windows may keep the SQLite file briefly locked; ignore teardown failure.
        pass


@pytest.mark.asyncio
async def test_memory_backend_round_trip():
    backend = MemorySessionBackend(max_turns=2)
    await backend.initialize()

    backend.add_message("s1", "user", "hello")
    backend.add_message("s1", "assistant", "hi")
    backend.add_message("s1", "user", "world")

    messages = backend.get_messages("s1")
    # max_turns=2 -> max_messages=4; we have 3 messages so none are dropped
    assert len(messages) == 3
    assert messages[-1]["content"] == "world"

    # Add 2 more messages to exceed the window
    backend.add_message("s1", "assistant", "world reply")
    backend.add_message("s1", "user", "again")
    messages = backend.get_messages("s1")
    assert len(messages) == 4
    assert messages[0]["content"] == "hi"
    assert messages[-1]["content"] == "again"

    backend.set_schema_cache("s1", {"tables": []})
    assert backend.get_schema_cache("s1") == {"tables": []}

    backend.clear_session("s1")
    assert backend.get_messages("s1") == []
    assert backend.get_schema_cache("s1") is None


@pytest.mark.asyncio
async def test_sqlite_backend_round_trip(sqlite_backend):
    backend = sqlite_backend
    backend.add_message("s1", "user", "hello")
    backend.add_message("s1", "assistant", "hi")

    messages = backend.get_messages("s1")
    assert len(messages) == 2

    backend.set_schema_cache("s1", {"tables": [{"name": "products"}]})
    assert backend.get_schema_cache("s1")["tables"][0]["name"] == "products"

    backend.clear_session("s1")
    assert backend.get_messages("s1") == []
    assert backend.get_schema_cache("s1") is None
