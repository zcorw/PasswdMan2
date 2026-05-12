from datetime import UTC, datetime, timedelta
import json
import os

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi.testclient import TestClient

from app.crypto.transport import (
    ALGORITHM,
    CryptoEnvelopeError,
    NonceReplayStore,
    b64encode,
    derive_aes_key,
    envelope_aad,
    get_server_key_provider,
)
from app.main import app


client = TestClient(app)


def make_envelope(payload: dict, timestamp: str | None = None) -> dict[str, str]:
    server_key = get_server_key_provider()
    client_private_key = x25519.X25519PrivateKey.generate()
    client_public_key = client_private_key.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    shared_secret = client_private_key.exchange(x25519.X25519PublicKey.from_public_bytes(server_key.public_key_bytes))
    aes_key = derive_aes_key(shared_secret)
    nonce = os.urandom(12)
    timestamp_value = timestamp or datetime.now(UTC).isoformat().replace("+00:00", "Z")
    ciphertext = AESGCM(aes_key).encrypt(
        nonce,
        json.dumps(payload, separators=(",", ":")).encode("utf-8"),
        envelope_aad(ALGORITHM, server_key.key_id, timestamp_value),
    )

    return {
        "algorithm": ALGORITHM,
        "keyId": server_key.key_id,
        "nonce": b64encode(nonce),
        "timestamp": timestamp_value,
        "clientPublicKey": b64encode(client_public_key),
        "ciphertext": b64encode(ciphertext),
    }


def test_server_public_key_endpoint() -> None:
    response = client.get("/api/crypto/server-public-key", headers={"X-Request-ID": "req_crypto"})

    assert response.status_code == 200
    body = response.json()
    assert body["requestId"] == "req_crypto"
    assert body["data"]["algorithm"] == ALGORITHM
    assert body["data"]["keyId"].startswith("key_")
    assert body["data"]["publicKey"]
    assert body["data"]["expiresAt"].endswith("Z")


def test_valid_envelope_decrypts() -> None:
    envelope = make_envelope({"message": "secret"})
    decrypted = get_server_key_provider().decrypt_envelope(envelope, NonceReplayStore())

    assert decrypted.payload == {"message": "secret"}


def test_replayed_nonce_is_rejected() -> None:
    envelope = make_envelope({"message": "secret"})
    nonce_store = NonceReplayStore()

    get_server_key_provider().decrypt_envelope(envelope, nonce_store)

    with pytest.raises(CryptoEnvelopeError) as exc_info:
        get_server_key_provider().decrypt_envelope(envelope, nonce_store)

    assert exc_info.value.code == "REPLAY_DETECTED"


def test_tampered_ciphertext_is_rejected() -> None:
    envelope = make_envelope({"message": "secret"})
    envelope["ciphertext"] = b64encode(b"tampered-ciphertext")

    with pytest.raises(CryptoEnvelopeError) as exc_info:
        get_server_key_provider().decrypt_envelope(envelope, NonceReplayStore())

    assert exc_info.value.code == "DECRYPTION_FAILED"


def test_expired_timestamp_is_rejected() -> None:
    expired = (datetime.now(UTC) - timedelta(minutes=10)).isoformat().replace("+00:00", "Z")
    envelope = make_envelope({"message": "secret"}, timestamp=expired)

    with pytest.raises(CryptoEnvelopeError) as exc_info:
        get_server_key_provider().decrypt_envelope(envelope, NonceReplayStore())

    assert exc_info.value.code == "EXPIRED_TIMESTAMP"
