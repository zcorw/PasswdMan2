from datetime import UTC, datetime
import json
import os

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

import app.auth.models  # noqa: F401
import app.vault.models  # noqa: F401
from app.auth.models import Session as AuthSession
from app.crypto.transport import (
    ALGORITHM,
    b64encode,
    derive_aes_key,
    envelope_aad,
    get_nonce_store,
    get_server_key_provider,
)
from app.db import Base, get_db
from app.main import app


def make_envelope(payload: dict) -> dict[str, str]:
    server_key = get_server_key_provider()
    client_private_key = x25519.X25519PrivateKey.generate()
    client_public_key = client_private_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    shared_secret = client_private_key.exchange(x25519.X25519PublicKey.from_public_bytes(server_key.public_key_bytes))
    aes_key = derive_aes_key(shared_secret)
    nonce = os.urandom(12)
    timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    ciphertext = AESGCM(aes_key).encrypt(
        nonce,
        json.dumps(payload, separators=(",", ":")).encode("utf-8"),
        envelope_aad(ALGORITHM, server_key.key_id, timestamp),
    )
    return {
        "algorithm": ALGORITHM,
        "keyId": server_key.key_id,
        "nonce": b64encode(nonce),
        "timestamp": timestamp,
        "clientPublicKey": b64encode(client_public_key),
        "ciphertext": b64encode(ciphertext),
    }


@pytest.fixture()
def client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'auth.db'}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    get_nonce_store().clear()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client, TestingSessionLocal
    app.dependency_overrides.clear()


def register(
    client: TestClient,
    email: str = "alice@example.com",
    password: str = "correct horse battery staple",
    encrypted_vault_key: str = "encrypted-vault-key-v1",
):
    return client.post(
        "/api/auth/register",
        json=make_envelope(
            {
                "email": email,
                "password": password,
                "encryptedVaultKey": encrypted_vault_key,
            }
        ),
    )


def login(client: TestClient, email: str = "alice@example.com", password: str = "correct horse battery staple"):
    return client.post("/api/auth/login", json=make_envelope({"email": email, "password": password}))


def test_register_login_session_and_logout(client) -> None:
    test_client, _ = client

    register_response = register(test_client)
    assert register_response.status_code == 201
    assert register_response.json()["data"]["user"]["email"] == "alice@example.com"
    assert register_response.json()["data"]["vault"]["encryptedVaultKey"] == "encrypted-vault-key-v1"

    login_response = login(test_client)
    assert login_response.status_code == 200
    cookie = login_response.headers["set-cookie"]
    assert "passwdman2_session=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie

    session_response = test_client.get("/api/auth/session")
    assert session_response.status_code == 200
    assert session_response.json()["data"]["user"]["email"] == "alice@example.com"

    logout_response = test_client.post("/api/auth/logout")
    assert logout_response.status_code == 200

    after_logout = test_client.get("/api/auth/session")
    assert after_logout.status_code == 401


def test_wrong_password_is_rejected_and_session_token_is_hashed(client) -> None:
    test_client, SessionLocal = client
    register(test_client)

    wrong_password = login(test_client, password="wrong password value")
    assert wrong_password.status_code == 401

    login_response = login(test_client)
    assert login_response.status_code == 200
    raw_cookie = test_client.cookies.get("passwdman2_session")
    assert raw_cookie

    with SessionLocal() as db:
        stored_session = db.scalars(select(AuthSession)).one()
        assert stored_session.token_hash != raw_cookie
        assert len(stored_session.token_hash) == 64


def test_register_and_login_require_encrypted_payload(client) -> None:
    test_client, _ = client

    plain_register = test_client.post(
        "/api/auth/register",
        json={"email": "plain@example.com", "password": "correct horse battery staple"},
    )
    assert plain_register.status_code == 400
    assert plain_register.json()["error"]["code"] == "INVALID_ALGORITHM"

    plain_login = test_client.post(
        "/api/auth/login",
        json={"email": "plain@example.com", "password": "correct horse battery staple"},
    )
    assert plain_login.status_code == 400
    assert plain_login.json()["error"]["code"] == "INVALID_ALGORITHM"


def test_failed_login_lockout(client) -> None:
    test_client, _ = client
    register(test_client)

    for _ in range(5):
        response = login(test_client, password="wrong password value")
        assert response.status_code == 401

    locked_response = login(test_client)
    assert locked_response.status_code == 429
    assert locked_response.json()["error"]["code"] == "LOGIN_LOCKED"


def test_user_can_list_and_revoke_active_sessions(client) -> None:
    test_client, SessionLocal = client
    register(test_client)
    login(test_client)

    sessions_response = test_client.get("/api/auth/sessions")
    assert sessions_response.status_code == 200
    sessions = sessions_response.json()["data"]["sessions"]
    assert len(sessions) == 1

    revoke_response = test_client.delete(f"/api/auth/sessions/{sessions[0]['id']}")
    assert revoke_response.status_code == 200

    with SessionLocal() as db:
        stored_session = db.scalars(select(AuthSession)).one()
        assert stored_session.status == "revoked"
