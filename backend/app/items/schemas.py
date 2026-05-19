from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


VALID_STATUSES = {"active", "archived"}


class ItemCreatePayload(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    url: str | None = Field(default=None, max_length=2048)
    username: str | None = Field(default=None, max_length=320)
    encrypted_secret: str = Field(alias="encryptedSecret", min_length=1, max_length=5_000_000)
    favorite: bool = False

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("title is required")
        return normalized

    @field_validator("url", "username")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class ItemUpdatePayload(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    url: str | None = Field(default=None, max_length=2048)
    username: str | None = Field(default=None, max_length=320)
    encrypted_secret: str | None = Field(default=None, alias="encryptedSecret", min_length=1, max_length=5_000_000)
    favorite: bool | None = None
    status: str | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        if not normalized:
            raise ValueError("title is required")
        return normalized

    @field_validator("url", "username")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is not None and value not in VALID_STATUSES:
            raise ValueError("status must be active or archived")
        return value


def validate_item_create_payload(payload: Any) -> ItemCreatePayload:
    return ItemCreatePayload.model_validate(payload)


def validate_item_update_payload(payload: Any) -> ItemUpdatePayload:
    return ItemUpdatePayload.model_validate(payload)
