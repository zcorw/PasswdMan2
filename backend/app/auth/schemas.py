from __future__ import annotations

import re
from typing import Any

from pydantic import BaseModel, Field, field_validator


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class LoginPayload(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=12, max_length=256)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not EMAIL_RE.match(email):
            raise ValueError("email must be valid")
        return email


class RegisterPayload(LoginPayload):
    encrypted_vault_key: str = Field(alias="encryptedVaultKey", min_length=1, max_length=65536)


def validate_login_payload(payload: Any) -> LoginPayload:
    return LoginPayload.model_validate(payload)


def validate_register_payload(payload: Any) -> RegisterPayload:
    return RegisterPayload.model_validate(payload)
