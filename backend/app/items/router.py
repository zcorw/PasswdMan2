from __future__ import annotations

from typing import Any, Callable

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session as DbSession

from app.audit.service import record_audit_event
from app.auth.dependencies import active_session_from_cookie
from app.auth.security import normalize_utc, utc_now
from app.crypto.transport import CryptoEnvelopeError, get_nonce_store, get_server_key_provider
from app.db import get_db
from app.items.models import PasswordItem
from app.items.schemas import validate_item_create_payload, validate_item_update_payload
from app.responses import error_response, ok_response
from app.settings import Settings, get_settings
from app.vault.models import Vault


router = APIRouter(prefix="/api/items", tags=["items"])


def item_data(item: PasswordItem) -> dict[str, Any]:
    return {
        "id": item.id,
        "title": item.title,
        "url": item.url,
        "username": item.username,
        "encryptedSecret": item.encrypted_secret,
        "favorite": item.favorite,
        "status": item.status,
        "createdAt": normalize_utc(item.created_at).isoformat().replace("+00:00", "Z"),
        "updatedAt": normalize_utc(item.updated_at).isoformat().replace("+00:00", "Z"),
    }


def current_vault(request: Request, db: DbSession, settings: Settings) -> Vault | Response:
    session = active_session_from_cookie(request, db, settings)
    if session is None:
        return error_response(request, "UNAUTHENTICATED", "Authentication required", 401)

    vault = db.scalar(select(Vault).where(Vault.user_id == session.user_id))
    if vault is None:
        return error_response(request, "VAULT_NOT_FOUND", "Vault has not been initialized", 404)

    return vault


def decrypt_item_payload(request: Request, envelope: dict[str, Any], validator: Callable[[Any], Any]):
    try:
        decrypted = get_server_key_provider().decrypt_envelope(envelope, get_nonce_store())
        return validator(decrypted.payload)
    except CryptoEnvelopeError as exc:
        return error_response(request, exc.code, exc.message, 400)
    except ValueError:
        return error_response(request, "INVALID_ITEM_PAYLOAD", "Invalid item payload", 422)


def get_owned_item(db: DbSession, vault_id: str, item_id: str) -> PasswordItem | None:
    return db.scalar(
        select(PasswordItem)
        .where(PasswordItem.id == item_id)
        .where(PasswordItem.vault_id == vault_id)
        .where(PasswordItem.status != "deleted")
    )


@router.post("")
def create_item(
    request: Request,
    envelope: dict[str, Any],
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    payload = decrypt_item_payload(request, envelope, validate_item_create_payload)
    if isinstance(payload, Response):
        return payload

    now = utc_now()
    item = PasswordItem(
        vault_id=vault.id,
        title=payload.title,
        url=payload.url,
        username=payload.username,
        encrypted_secret=payload.encrypted_secret,
        favorite=payload.favorite,
        status="active",
        created_at=now,
        updated_at=now,
    )
    db.add(item)
    db.flush()
    record_audit_event(
        db,
        request,
        user_id=vault.user_id,
        action="item.created",
        resource_type="password_item",
        resource_id=item.id,
        metadata={"title": item.title, "status": item.status},
    )
    db.commit()
    db.refresh(item)

    return ok_response(request, {"item": item_data(item)}, status_code=201)


@router.get("")
def list_items(
    request: Request,
    q: str | None = None,
    favorite: bool | None = None,
    status: str = Query(default="active", pattern="^(active|archived|all)$"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=100),
    sort: str = Query(default="updatedAtDesc", pattern="^(updatedAtDesc|titleAsc|createdAtDesc)$"),
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    query = select(PasswordItem).where(PasswordItem.vault_id == vault.id)
    query = query.where(PasswordItem.status != "deleted")
    if status != "all":
        query = query.where(PasswordItem.status == status)
    if favorite is not None:
        query = query.where(PasswordItem.favorite == favorite)
    if q:
        search = f"%{q.strip()}%"
        query = query.where(
            or_(
                PasswordItem.title.ilike(search),
                PasswordItem.url.ilike(search),
                PasswordItem.username.ilike(search),
            )
        )

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    if sort == "titleAsc":
        query = query.order_by(PasswordItem.title.asc(), PasswordItem.updated_at.desc())
    elif sort == "createdAtDesc":
        query = query.order_by(PasswordItem.created_at.desc())
    else:
        query = query.order_by(PasswordItem.updated_at.desc())

    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
    return ok_response(
        request,
        {
            "items": [item_data(item) for item in items],
            "pagination": {"page": page, "pageSize": page_size, "total": total},
        },
    )


@router.get("/{item_id}")
def get_item(
    item_id: str,
    request: Request,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    item = get_owned_item(db, vault.id, item_id)
    if item is None:
        return error_response(request, "NOT_FOUND", "Item not found", 404)

    return ok_response(request, {"item": item_data(item)})


@router.patch("/{item_id}")
def update_item(
    item_id: str,
    request: Request,
    envelope: dict[str, Any],
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    item = get_owned_item(db, vault.id, item_id)
    if item is None:
        return error_response(request, "NOT_FOUND", "Item not found", 404)

    payload = decrypt_item_payload(request, envelope, validate_item_update_payload)
    if isinstance(payload, Response):
        return payload

    if payload.title is not None:
        item.title = payload.title
    if "url" in payload.model_fields_set:
        item.url = payload.url
    if "username" in payload.model_fields_set:
        item.username = payload.username
    if payload.encrypted_secret is not None:
        item.encrypted_secret = payload.encrypted_secret
    if payload.favorite is not None:
        item.favorite = payload.favorite
    if payload.status is not None:
        item.status = payload.status
    item.updated_at = utc_now()
    record_audit_event(
        db,
        request,
        user_id=vault.user_id,
        action="item.updated",
        resource_type="password_item",
        resource_id=item.id,
        metadata={"title": item.title, "status": item.status},
    )

    db.commit()
    db.refresh(item)
    return ok_response(request, {"item": item_data(item)})


@router.delete("/{item_id}")
def delete_item(
    item_id: str,
    request: Request,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    vault = current_vault(request, db, settings)
    if isinstance(vault, Response):
        return vault

    item = get_owned_item(db, vault.id, item_id)
    if item is None:
        return error_response(request, "NOT_FOUND", "Item not found", 404)

    item.status = "deleted"
    item.deleted_at = utc_now()
    item.updated_at = item.deleted_at
    record_audit_event(
        db,
        request,
        user_id=vault.user_id,
        action="item.deleted",
        resource_type="password_item",
        resource_id=item.id,
        metadata={"title": item.title},
    )
    db.commit()

    return ok_response(request, {"deleted": True})
