from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DbSession

from app.auth.dependencies import active_session_from_cookie
from app.auth.models import Session, User
from app.auth.schemas import validate_login_payload, validate_register_payload
from app.auth.security import (
    create_session_token,
    hash_password,
    hash_session_token,
    normalize_utc,
    utc_now,
    verify_password,
)
from app.crypto.transport import CryptoEnvelopeError, get_nonce_store, get_server_key_provider
from app.db import get_db
from app.responses import error_response, ok_response
from app.settings import Settings, get_settings
from app.vault.models import Vault


router = APIRouter(prefix="/api/auth", tags=["auth"])


def user_data(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "status": user.status,
        "createdAt": normalize_utc(user.created_at).isoformat().replace("+00:00", "Z"),
    }


def registration_vault_data(vault: Vault) -> dict[str, Any]:
    return {
        "id": vault.id,
        "name": vault.name,
        "encryptedVaultKey": vault.encrypted_vault_key,
        "revision": vault.revision,
    }


def decrypt_payload(request: Request, envelope: dict[str, Any], validator):
    try:
        decrypted = get_server_key_provider().decrypt_envelope(envelope, get_nonce_store())
        return validator(decrypted.payload)
    except CryptoEnvelopeError as exc:
        return error_response(request, exc.code, exc.message, 400)
    except ValueError:
        return error_response(request, "INVALID_AUTH_PAYLOAD", "Invalid email or password", 422)


@router.post("/register")
def register(
    request: Request,
    envelope: dict[str, Any],
    db: DbSession = Depends(get_db),
) -> Response:
    auth_payload = decrypt_payload(request, envelope, validate_register_payload)
    if isinstance(auth_payload, Response):
        return auth_payload

    now = utc_now()
    user = User(
        email=auth_payload.email,
        password_hash=hash_password(auth_payload.password),
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    try:
        db.flush()
        vault = Vault(
            user_id=user.id,
            name="Personal Vault",
            encrypted_vault_key=auth_payload.encrypted_vault_key,
            encrypted_data="",
            revision=1,
            created_at=now,
            updated_at=now,
        )
        db.add(vault)
        db.commit()
    except IntegrityError:
        db.rollback()
        return error_response(request, "EMAIL_ALREADY_REGISTERED", "Email is already registered", 409)

    db.refresh(user)
    db.refresh(vault)
    return ok_response(request, {"user": user_data(user), "vault": registration_vault_data(vault)}, status_code=201)


@router.post("/login")
def login(
    request: Request,
    envelope: dict[str, Any],
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    auth_payload = decrypt_payload(request, envelope, validate_login_payload)
    if isinstance(auth_payload, Response):
        return auth_payload

    user = db.scalar(select(User).where(User.email == auth_payload.email))
    now = utc_now()
    generic_error = error_response(request, "INVALID_CREDENTIALS", "Invalid email or password", 401)
    if user is None or user.status != "active":
        return generic_error

    if user.locked_until and normalize_utc(user.locked_until) > now:
        return error_response(request, "LOGIN_LOCKED", "Too many failed login attempts", 429)

    if not verify_password(auth_payload.password, user.password_hash):
        user.failed_login_count += 1
        if user.failed_login_count >= settings.login_max_failures:
            user.locked_until = now + timedelta(minutes=settings.login_lockout_minutes)
        user.updated_at = now
        db.commit()
        return generic_error

    user.failed_login_count = 0
    user.locked_until = None
    user.updated_at = now

    token = create_session_token()
    session = Session(
        user_id=user.id,
        token_hash=hash_session_token(token),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=now + timedelta(minutes=settings.session_ttl_minutes),
        created_at=now,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    response = ok_response(
        request,
        {
            "user": user_data(user),
            "session": {
                "id": session.id,
                "expiresAt": normalize_utc(session.expires_at).isoformat().replace("+00:00", "Z"),
            },
        },
    )
    response.set_cookie(
        settings.session_cookie_name,
        token,
        max_age=settings.session_ttl_minutes * 60,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        path="/",
    )
    return response


@router.post("/logout")
def logout(
    request: Request,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    session = active_session_from_cookie(request, db, settings)
    if session is not None:
        session.status = "revoked"
        session.revoked_at = utc_now()
        db.commit()

    response = ok_response(request, {"loggedOut": True})
    response.delete_cookie(
        settings.session_cookie_name,
        path="/",
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        httponly=True,
    )
    return response


@router.get("/session")
def current_session(
    request: Request,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    session = active_session_from_cookie(request, db, settings)
    if session is None:
        return error_response(request, "UNAUTHENTICATED", "Authentication required", 401)

    return ok_response(
        request,
        {
            "user": user_data(session.user),
            "session": {
                "id": session.id,
                "expiresAt": normalize_utc(session.expires_at).isoformat().replace("+00:00", "Z"),
            },
        },
    )
