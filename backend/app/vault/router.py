from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.auth.dependencies import active_session_from_cookie
from app.auth.security import normalize_utc, utc_now
from app.db import get_db
from app.responses import error_response, ok_response
from app.settings import Settings, get_settings
from app.vault.models import Vault
from app.vault.schemas import VaultSyncPayload


router = APIRouter(prefix="/api/vault", tags=["vault"])


def vault_data(vault: Vault) -> dict[str, Any]:
    return {
        "id": vault.id,
        "name": vault.name,
        "encryptedVaultKey": vault.encrypted_vault_key,
        "encryptedData": vault.encrypted_data,
        "revision": vault.revision,
        "updatedAt": normalize_utc(vault.updated_at).isoformat().replace("+00:00", "Z"),
    }


def current_vault(
    request: Request,
    db: DbSession,
    settings: Settings,
) -> Vault | Response:
    session = active_session_from_cookie(request, db, settings)
    if session is None:
        return error_response(request, "UNAUTHENTICATED", "Authentication required", 401)

    vault = db.scalar(select(Vault).where(Vault.user_id == session.user_id))
    if vault is None:
        return error_response(request, "VAULT_NOT_FOUND", "Vault has not been initialized", 404)

    return vault


@router.get("")
def get_vault(
    request: Request,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    return ok_response(request, {"vault": vault_data(vault)})


@router.put("")
def sync_vault(
    request: Request,
    payload: VaultSyncPayload,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    vault.encrypted_data = payload.encrypted_data
    if payload.encrypted_vault_key is not None:
        vault.encrypted_vault_key = payload.encrypted_vault_key
    vault.revision += 1
    vault.updated_at = utc_now()
    db.commit()
    db.refresh(vault)

    return ok_response(request, {"vault": vault_data(vault)})
