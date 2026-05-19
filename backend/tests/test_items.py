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
from app.items.models import PasswordItem
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
    engine = create_engine(f"sqlite:///{tmp_path / 'items.db'}", connect_args={"check_same_thread": False})
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
):
    return client.post(
        "/api/auth/register",
        json=make_envelope(
            {
                "email": email,
                "password": password,
                "encryptedVaultKey": f"encrypted-vault-key-{email}",
            }
        ),
    )


def login(client: TestClient, email: str = "alice@example.com", password: str = "correct horse battery staple"):
    return client.post("/api/auth/login", json=make_envelope({"email": email, "password": password}))


def create_item(
    client: TestClient,
    title: str = "GitHub",
    encrypted_secret: str = "encrypted-secret-v1",
    favorite: bool = False,
):
    return client.post(
        "/api/items",
        json=make_envelope(
            {
                "title": title,
                "url": "https://github.com",
                "username": "pack.william",
                "encryptedSecret": encrypted_secret,
                "favorite": favorite,
            }
        ),
    )


def test_item_crud_uses_encrypted_secret_only(client) -> None:
    test_client, SessionLocal = client
    register(test_client)
    login(test_client)

    create_response = create_item(test_client, encrypted_secret="encrypted-secret-v1", favorite=True)
    assert create_response.status_code == 201
    item = create_response.json()["data"]["item"]
    assert item["encryptedSecret"] == "encrypted-secret-v1"
    assert item["favorite"] is True

    with SessionLocal() as db:
        stored_item = db.scalars(select(PasswordItem)).one()
        assert stored_item.encrypted_secret == "encrypted-secret-v1"
        assert not hasattr(stored_item, "primary_password")
        assert not hasattr(stored_item, "secondary_passwords")

    detail_response = test_client.get(f"/api/items/{item['id']}")
    assert detail_response.status_code == 200
    assert detail_response.json()["data"]["item"]["encryptedSecret"] == "encrypted-secret-v1"

    update_response = test_client.patch(
        f"/api/items/{item['id']}",
        json=make_envelope(
            {
                "title": "GitHub updated",
                "encryptedSecret": "encrypted-secret-v2",
                "favorite": False,
                "status": "archived",
            }
        ),
    )
    assert update_response.status_code == 200
    updated = update_response.json()["data"]["item"]
    assert updated["title"] == "GitHub updated"
    assert updated["encryptedSecret"] == "encrypted-secret-v2"
    assert updated["status"] == "archived"

    delete_response = test_client.delete(f"/api/items/{item['id']}")
    assert delete_response.status_code == 200

    missing_response = test_client.get(f"/api/items/{item['id']}")
    assert missing_response.status_code == 404


def test_item_list_supports_search_filters_and_pagination(client) -> None:
    test_client, _ = client
    register(test_client)
    login(test_client)
    create_item(test_client, title="GitHub", encrypted_secret="encrypted-secret-github", favorite=True)
    create_item(test_client, title="Bank", encrypted_secret="encrypted-secret-bank", favorite=False)

    response = test_client.get("/api/items", params={"q": "git", "favorite": "true", "pageSize": 1})

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["pagination"]["total"] == 1
    assert body["items"][0]["title"] == "GitHub"


def test_item_create_and_update_require_encrypted_payload(client) -> None:
    test_client, _ = client
    register(test_client)
    login(test_client)

    plain_create = test_client.post(
        "/api/items",
        json={
            "title": "Plain",
            "encryptedSecret": "encrypted-secret",
        },
    )
    assert plain_create.status_code == 400
    assert plain_create.json()["error"]["code"] == "INVALID_ALGORITHM"

    item = create_item(test_client).json()["data"]["item"]
    plain_update = test_client.patch(f"/api/items/{item['id']}", json={"title": "Plain update"})
    assert plain_update.status_code == 400
    assert plain_update.json()["error"]["code"] == "INVALID_ALGORITHM"


def test_item_title_rejects_whitespace_after_trimming(client) -> None:
    test_client, _ = client
    register(test_client)
    login(test_client)

    create_response = test_client.post(
        "/api/items",
        json=make_envelope(
            {
                "title": "   ",
                "encryptedSecret": "encrypted-secret",
            }
        ),
    )
    assert create_response.status_code == 422
    assert create_response.json()["error"]["code"] == "INVALID_ITEM_PAYLOAD"

    item = create_item(test_client).json()["data"]["item"]
    update_response = test_client.patch(
        f"/api/items/{item['id']}",
        json=make_envelope(
            {
                "title": "   ",
            }
        ),
    )
    assert update_response.status_code == 422
    assert update_response.json()["error"]["code"] == "INVALID_ITEM_PAYLOAD"


def test_item_access_is_limited_to_owner_vault(client) -> None:
    test_client, _ = client
    register(test_client, email="alice@example.com")
    login(test_client, email="alice@example.com")
    item = create_item(test_client).json()["data"]["item"]

    register(test_client, email="bob@example.com")
    login(test_client, email="bob@example.com")

    response = test_client.get(f"/api/items/{item['id']}")

    assert response.status_code == 404
