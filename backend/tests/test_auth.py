import os

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_auth_endpoints_when_disabled():
    """When AUTH_ENABLED=false, /auth/me returns anonymous and /auth/login rejects."""
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "anonymous"

    response = client.post("/api/auth/login", json={"username": "dataflow", "password": "dataflow"})
    # Login is disabled when auth is off
    assert response.status_code == 401


def test_api_routes_work_without_auth_by_default():
    response = client.get("/api/schema")
    assert response.status_code == 200
    assert response.json()["success"] is True


def test_api_routes_require_auth_when_enabled(monkeypatch):
    monkeypatch.setenv("AUTH_ENABLED", "true")
    monkeypatch.setenv("AUTH_DEMO_PASSWORD", "dataflow")
    # Re-create client so the app picks up the new env
    test_client = TestClient(app)

    # Schema without auth should fail
    response = test_client.get("/api/schema")
    assert response.status_code == 401

    # Login with valid credentials
    response = test_client.post("/api/auth/login", json={"username": "dataflow", "password": "dataflow"})
    assert response.status_code == 200
    token = response.json()["access_token"]

    # Schema with Bearer token should succeed
    response = test_client.get("/api/schema", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["success"] is True
