from __future__ import annotations

from pydantic import BaseModel, Field


class VaultSyncPayload(BaseModel):
    encrypted_vault_key: str | None = Field(default=None, alias="encryptedVaultKey", min_length=1, max_length=65536)
    encrypted_data: str = Field(alias="encryptedData", max_length=5_000_000)
