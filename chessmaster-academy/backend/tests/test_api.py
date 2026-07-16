import os
import sys

os.environ["DATABASE_URL"] = "sqlite:///./test_chessmaster.db"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient

from app.db import Base, engine
from app.main import app


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


def _register(client, email="kid@example.com", name="Vayun"):
    r = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "supersafe123", "display_name": name},
    )
    assert r.status_code == 201, r.text
    return r.json()


def _auth(tokens):
    return {"Authorization": f"Bearer {tokens['access_token']}"}


def test_health(client):
    assert client.get("/healthz").json() == {"status": "ok"}


def test_register_login_me(client):
    tokens = _register(client)
    me = client.get("/api/v1/users/me", headers=_auth(tokens))
    assert me.status_code == 200
    assert me.json()["display_name"] == "Vayun"

    dup = client.post(
        "/api/v1/auth/register",
        json={"email": "kid@example.com", "password": "supersafe123", "display_name": "X"},
    )
    assert dup.status_code == 409

    bad = client.post("/api/v1/auth/login", json={"email": "kid@example.com", "password": "wrong-pass"})
    assert bad.status_code == 401

    good = client.post("/api/v1/auth/login", json={"email": "kid@example.com", "password": "supersafe123"})
    assert good.status_code == 200


def test_refresh_rotates(client):
    tokens = _register(client)
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert r.status_code == 200
    assert r.json()["access_token"]

    r = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["access_token"]})
    assert r.status_code == 401  # wrong token type


def test_profile_patch(client):
    tokens = _register(client)
    r = client.patch(
        "/api/v1/users/me",
        headers=_auth(tokens),
        json={"age": 10, "current_rating": 520, "target_rating": 1200, "daily_minutes": 20},
    )
    assert r.status_code == 200
    assert r.json()["current_rating"] == 520


def test_progress_sync_with_conflict(client):
    tokens = _register(client)
    h = _auth(tokens)

    r = client.get("/api/v1/progress/sync", headers=h)
    assert r.json() == {"version": 0, "data": {}, "updated_at": None}

    r = client.put("/api/v1/progress/sync", headers=h, json={"version": 0, "data": {"xp": 120}})
    assert r.status_code == 200
    assert r.json()["version"] == 1

    r = client.put("/api/v1/progress/sync", headers=h, json={"version": 1, "data": {"xp": 200}})
    assert r.json()["version"] == 2

    # Stale write is rejected with the server state for client-side merge
    r = client.put("/api/v1/progress/sync", headers=h, json={"version": 1, "data": {"xp": 50}})
    assert r.status_code == 409
    assert r.json()["detail"]["server_version"] == 2


def test_games_crud(client):
    tokens = _register(client)
    h = _auth(tokens)
    r = client.post(
        "/api/v1/games",
        headers=h,
        json={"pgn": "1. e4 e5 2. Nf3 *", "result": "*", "color": "white", "engine_level": 2, "accuracy": 87.5},
    )
    assert r.status_code == 201
    game_id = r.json()["id"]

    assert len(client.get("/api/v1/games", headers=h).json()) == 1
    assert client.get(f"/api/v1/games/{game_id}", headers=h).json()["accuracy"] == 87.5

    other = _register(client, email="other@example.com", name="Other")
    r = client.get(f"/api/v1/games/{game_id}", headers=_auth(other))
    assert r.status_code == 404  # cannot read another user's game


def test_family_link_and_report(client):
    child = _register(client, email="child@example.com", name="Child")
    parent = _register(client, email="parent@example.com", name="Parent")

    code = client.post("/api/v1/family/invite", headers=_auth(child)).json()["code"]
    r = client.post("/api/v1/family/accept", headers=_auth(parent), json={"code": code})
    assert r.status_code == 200
    child_id = r.json()["id"]

    kids = client.get("/api/v1/family/children", headers=_auth(parent)).json()
    assert len(kids) == 1

    report = client.get(f"/api/v1/family/children/{child_id}/report", headers=_auth(parent))
    assert report.status_code == 200

    # A stranger cannot read the report
    stranger = _register(client, email="s@example.com", name="S")
    r = client.get(f"/api/v1/family/children/{child_id}/report", headers=_auth(stranger))
    assert r.status_code == 403


def test_leaderboard(client):
    tokens = _register(client)
    h = _auth(tokens)
    client.post("/api/v1/progress/puzzle-attempts", headers=h, json={"puzzle_id": "p1", "theme": "fork", "solved": True})
    client.post("/api/v1/progress/puzzle-attempts", headers=h, json={"puzzle_id": "p2", "theme": "pin", "solved": True})
    rows = client.get("/api/v1/leaderboard?scope=weekly_puzzles", headers=h).json()
    assert rows[0]["value"] == 2
