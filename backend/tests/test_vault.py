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
from app.vault.models import Vault


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
    engine = create_engine(f"sqlite:///{tmp_path / 'vault.db'}", connect_args={"check_same_thread": False})
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


def test_register_creates_default_vault_with_encrypted_key(client) -> None:
    test_client, SessionLocal = client

    response = register(test_client, encrypted_vault_key="encrypted-vault-key-v1")
    assert response.status_code == 201
    assert response.json()["data"]["vault"]["encryptedVaultKey"] == "encrypted-vault-key-v1"

    with SessionLocal() as db:
        vault = db.scalars(select(Vault)).one()
        assert vault.name == "Personal Vault"
        assert vault.encrypted_vault_key == "encrypted-vault-key-v1"
        assert not hasattr(vault, "vault_key")
        assert not hasattr(vault, "master_password")


def test_vault_requires_login(client) -> None:
    test_client, _ = client

    response = test_client.get("/api/vault")

    assert response.status_code == 401


def test_logged_in_user_can_read_and_sync_encrypted_vault(client) -> None:
    test_client, _ = client
    register(test_client, encrypted_vault_key="encrypted-vault-key-v1")
    login_response = login(test_client)
    assert login_response.status_code == 200

    get_response = test_client.get("/api/vault")
    assert get_response.status_code == 200
    vault = get_response.json()["data"]["vault"]
    assert vault["encryptedVaultKey"] == "encrypted-vault-key-v1"
    assert vault["encryptedData"] == ""
    assert vault["revision"] == 1

    sync_response = test_client.put(
        "/api/vault",
        json={
            "encryptedVaultKey": "encrypted-vault-key-v2",
            "encryptedData": "encrypted-vault-snapshot-v1",
        },
    )
    assert sync_response.status_code == 200
    synced = sync_response.json()["data"]["vault"]
    assert synced["encryptedVaultKey"] == "encrypted-vault-key-v2"
    assert synced["encryptedData"] == "encrypted-vault-snapshot-v1"
    assert synced["revision"] == 2


def test_register_requires_encrypted_vault_key(client) -> None:
    test_client, _ = client

    response = test_client.post(
        "/api/auth/register",
        json=make_envelope({"email": "missing@example.com", "password": "correct horse battery staple"}),
    )

    assert response.status_code == 422
