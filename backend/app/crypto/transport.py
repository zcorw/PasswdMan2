from __future__ import annotations

import base64
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import json
import os
from threading import Lock
from typing import Any

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF


ALGORITHM = "X25519+AES-GCM"
HKDF_INFO = b"PasswdMan2 encrypted transport v1"
MAX_CLOCK_SKEW = timedelta(minutes=5)
NONCE_TTL = timedelta(minutes=10)


class CryptoEnvelopeError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message


def b64encode(raw: bytes) -> str:
    return base64.b64encode(raw).decode("ascii")


def b64decode(value: str, field_name: str) -> bytes:
    try:
        return base64.b64decode(value, validate=True)
    except Exception as exc:
        raise CryptoEnvelopeError("INVALID_ENVELOPE", f"{field_name} must be valid base64") from exc


def utc_now() -> datetime:
    return datetime.now(UTC)


def parse_timestamp(value: str) -> datetime:
    try:
        normalized = value.replace("Z", "+00:00")
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise CryptoEnvelopeError("INVALID_TIMESTAMP", "timestamp must be ISO-8601") from exc

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)

    return parsed.astimezone(UTC)


def json_bytes(payload: Any) -> bytes:
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")


def json_from_bytes(payload: bytes) -> Any:
    return json.loads(payload.decode("utf-8"))


def derive_aes_key(shared_secret: bytes) -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=HKDF_INFO,
    ).derive(shared_secret)


def envelope_aad(algorithm: str, key_id: str, timestamp: str) -> bytes:
    return f"{algorithm}|{key_id}|{timestamp}".encode("utf-8")


class NonceReplayStore:
    def __init__(self) -> None:
        self._seen: dict[str, datetime] = {}
        self._lock = Lock()

    def check_and_store(self, nonce: str, now: datetime) -> None:
        expires_before = now - NONCE_TTL

        with self._lock:
            self._seen = {
                stored_nonce: stored_at
                for stored_nonce, stored_at in self._seen.items()
                if stored_at >= expires_before
            }

            if nonce in self._seen:
                raise CryptoEnvelopeError("REPLAY_DETECTED", "nonce has already been used")

            self._seen[nonce] = now

    def clear(self) -> None:
        with self._lock:
            self._seen.clear()


@dataclass(frozen=True)
class DecryptedEnvelope:
    payload: Any
    client_public_key: bytes
    key_id: str
    timestamp: str


class ServerKeyProvider:
    def __init__(self) -> None:
        self._private_key = x25519.X25519PrivateKey.generate()
        created_at = utc_now()
        self.key_id = f"key_{created_at:%Y%m%d%H%M%S}"
        self.expires_at = created_at + timedelta(days=30)

    @property
    def public_key_bytes(self) -> bytes:
        return self._private_key.public_key().public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw,
        )

    def public_key_response(self) -> dict[str, str]:
        return {
            "keyId": self.key_id,
            "algorithm": ALGORITHM,
            "publicKey": b64encode(self.public_key_bytes),
            "expiresAt": self.expires_at.isoformat().replace("+00:00", "Z"),
        }

    def decrypt_envelope(self, envelope: dict[str, Any], nonce_store: NonceReplayStore) -> DecryptedEnvelope:
        algorithm = envelope.get("algorithm")
        key_id = envelope.get("keyId")
        nonce = envelope.get("nonce")
        timestamp = envelope.get("timestamp")
        client_public_key_value = envelope.get("clientPublicKey")
        ciphertext_value = envelope.get("ciphertext")

        if algorithm != ALGORITHM:
            raise CryptoEnvelopeError("INVALID_ALGORITHM", "unsupported encrypted transport algorithm")
        if key_id != self.key_id:
            raise CryptoEnvelopeError("INVALID_KEY_ID", "unknown or expired keyId")
        if not all(isinstance(value, str) for value in [nonce, timestamp, client_public_key_value, ciphertext_value]):
            raise CryptoEnvelopeError("INVALID_ENVELOPE", "encrypted envelope is missing required string fields")

        now = utc_now()
        parsed_timestamp = parse_timestamp(timestamp)
        if abs(now - parsed_timestamp) > MAX_CLOCK_SKEW:
            raise CryptoEnvelopeError("EXPIRED_TIMESTAMP", "timestamp is outside the allowed clock skew")

        nonce_bytes = b64decode(nonce, "nonce")
        if len(nonce_bytes) != 12:
            raise CryptoEnvelopeError("INVALID_NONCE", "nonce must be 12 bytes")

        client_public_key = b64decode(client_public_key_value, "clientPublicKey")
        if len(client_public_key) != 32:
            raise CryptoEnvelopeError("INVALID_CLIENT_PUBLIC_KEY", "clientPublicKey must be 32 bytes")

        ciphertext = b64decode(ciphertext_value, "ciphertext")
        shared_secret = self._private_key.exchange(x25519.X25519PublicKey.from_public_bytes(client_public_key))
        aes_key = derive_aes_key(shared_secret)

        try:
            plaintext = AESGCM(aes_key).decrypt(
                nonce_bytes,
                ciphertext,
                envelope_aad(algorithm, key_id, timestamp),
            )
        except InvalidTag as exc:
            raise CryptoEnvelopeError("DECRYPTION_FAILED", "ciphertext authentication failed") from exc

        nonce_store.check_and_store(nonce, now)

        return DecryptedEnvelope(
            payload=json_from_bytes(plaintext),
            client_public_key=client_public_key,
            key_id=key_id,
            timestamp=timestamp,
        )

    def encrypt_for_client(
        self,
        client_public_key: bytes,
        payload: Any,
        timestamp: str | None = None,
    ) -> dict[str, str]:
        timestamp_value = timestamp or utc_now().isoformat().replace("+00:00", "Z")
        nonce = os.urandom(12)
        shared_secret = self._private_key.exchange(x25519.X25519PublicKey.from_public_bytes(client_public_key))
        aes_key = derive_aes_key(shared_secret)
        ciphertext = AESGCM(aes_key).encrypt(
            nonce,
            json_bytes(payload),
            envelope_aad(ALGORITHM, self.key_id, timestamp_value),
        )

        return {
            "algorithm": ALGORITHM,
            "keyId": self.key_id,
            "nonce": b64encode(nonce),
            "timestamp": timestamp_value,
            "ciphertext": b64encode(ciphertext),
        }


_server_key_provider = ServerKeyProvider()
_nonce_store = NonceReplayStore()


def get_server_key_provider() -> ServerKeyProvider:
    return _server_key_provider


def get_nonce_store() -> NonceReplayStore:
    return _nonce_store
