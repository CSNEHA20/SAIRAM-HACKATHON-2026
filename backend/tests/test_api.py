import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

def test_schema_endpoint():
    response = client.get("/api/schema")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_tables"] >= 5

def test_chat_endpoint_empty_message():
    response = client.post("/api/chat", json={"message": "   ", "session_id": "test_s1"})
    assert response.status_code == 400

def test_chat_endpoint_sse_stream():
    response = client.post("/api/chat", json={"message": "Show me top 5 products", "session_id": "test_s1"})
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    text = response.text
    assert "data: " in text
    assert "tool_start" in text
    assert "token" in text
    assert "done" in text
