"""
Tests for Static File Serving, SPA Client-Side Routing Fallback,
and API Coexistence in PatientTriage.ai.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoints():
    """Verify both /health and /api/health return 200 healthy status."""
    r1 = client.get("/health")
    assert r1.status_code == 200
    assert r1.json()["status"] == "healthy"

    r2 = client.get("/api/health")
    assert r2.status_code == 200
    assert r2.json()["status"] == "healthy"


def test_system_info_endpoints():
    """Verify /api/info and /info return the JSON system metadata and disclaimer."""
    r1 = client.get("/api/info")
    assert r1.status_code == 200
    assert "PatientTriage.ai" in r1.json()["name"]
    assert "NOT a medical device" in r1.json()["disclaimer"]

    r2 = client.get("/info")
    assert r2.status_code == 200
    assert "PatientTriage.ai" in r2.json()["name"]


def test_docs_endpoints():
    """Verify OpenAPI and Swagger UI endpoints remain accessible."""
    r_docs = client.get("/docs")
    assert r_docs.status_code == 200
    assert "swagger" in r_docs.text.lower() or "html" in r_docs.headers.get("content-type", "").lower()

    r_openapi = client.get("/openapi.json")
    assert r_openapi.status_code == 200
    assert "openapi" in r_openapi.json()


def test_root_and_spa_routing():
    """Verify GET / and client-side SPA routes serve the HTML application."""
    # Root route /
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert "text/html" in r_root.headers.get("content-type", "")
    assert "<div id=\"root\">" in r_root.text or "PatientTriage" in r_root.text or "<!DOCTYPE html>" in r_root.text

    # Client-side SPA routes on direct refresh/open
    spa_routes = ["/login", "/queue", "/patients", "/dashboard", "/appointments", "/settings", "/audit-log"]
    for route in spa_routes:
        r_spa = client.get(route)
        assert r_spa.status_code == 200
        assert "text/html" in r_spa.headers.get("content-type", "")
        assert "<!DOCTYPE html>" in r_spa.text or "<div id=\"root\">" in r_spa.text or "<html" in r_spa.text


def test_api_routes_not_shadowed():
    """Verify API 404s and real API routes are handled properly and not shadowed by SPA."""
    # Calling an invalid API path should return 404 JSON, NOT index.html
    r_bad_api = client.get("/api/nonexistent-route-xyz")
    assert r_bad_api.status_code == 404
    assert "application/json" in r_bad_api.headers.get("content-type", "")
