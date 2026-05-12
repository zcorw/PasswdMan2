from datetime import UTC, datetime
import json
import os

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.audit.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.items.models  # noqa: F401
import app.vault.models  # noqa: F401
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
    engine = create_engine(f"sqlite:///{tmp_path / 'audit.db'}", connect_args={"check_same_thread": False})
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
        yield test_client
    app.dependency_overrides.clear()


def register(client: TestClient):
    return client.post(
        "/api/auth/register",
        json=make_envelope(
            {
                "email": "alice@example.com",
                "password": "correct horse battery staple",
                "encryptedVaultKey": "encrypted-vault-key",
            }
        ),
    )


def login(client: TestClient):
    return client.post(
        "/api/auth/login",
        json=make_envelope({"email": "alice@example.com", "password": "correct horse battery staple"}),
    )


def create_item(client: TestClient):
    return client.post(
        "/api/items",
        json=make_envelope(
            {
                "title": "GitHub",
                "url": "https://github.com",
                "username": "pack.william",
                "encryptedSecret": "encrypted-secret-v1",
                "favorite": False,
            }
        ),
    )


def test_audit_logs_security_events_without_sensitive_metadata(client) -> None:
    register(client)
    login(client)
    item = create_item(client).json()["data"]["item"]
    client.patch(
        f"/api/items/{item['id']}",
        json=make_envelope({"title": "GitHub updated", "encryptedSecret": "encrypted-secret-v2"}),
    )
    client.delete(f"/api/items/{item['id']}")
    client.post("/api/auth/logout")

    response = client.get("/api/audit/logs")
    assert response.status_code == 401

    login(client)
    response = client.get("/api/audit/logs")
    assert response.status_code == 200
    logs = response.json()["data"]["logs"]
    actions = {log["action"] for log in logs}
    assert {"auth.login", "auth.logout", "item.created", "item.updated", "item.deleted"}.issubset(actions)
    assert "encrypted-secret-v1" not in json.dumps(logs)
    assert "encrypted-secret-v2" not in json.dumps(logs)
    assert "correct horse battery staple" not in json.dumps(logs)


def test_client_audit_event_sanitizes_sensitive_metadata(client) -> None:
    register(client)
    login(client)

    response = client.post(
        "/api/audit/events",
        json={
            "action": "password.secondary.copied",
            "resourceType": "password_item",
            "resourceId": "item-1",
            "metadata": {
                "slot": "secondary",
                "password": "plain-password",
                "encryptedSecret": "encrypted-secret",
            },
        },
    )

    assert response.status_code == 201
    metadata = response.json()["data"]["log"]["metadata"]
    assert metadata == {"slot": "secondary"}
