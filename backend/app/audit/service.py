from __future__ import annotations

import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session as DbSession

from app.audit.models import AuditLog
from app.auth.security import normalize_utc, utc_now


SENSITIVE_KEY_PARTS = (
    "password",
    "secret",
    "token",
    "key",
    "cipher",
    "encrypted",
    "recovery",
)


def sanitize_audit_metadata(metadata: dict[str, Any] | None) -> dict[str, str | int | bool | None]:
    if not metadata:
        return {}

    sanitized: dict[str, str | int | bool | None] = {}
    for key, value in metadata.items():
        normalized_key = key.lower().replace("-", "_")
        if any(part in normalized_key for part in SENSITIVE_KEY_PARTS):
            continue
        if value is None or isinstance(value, (str, int, bool)):
            sanitized[normalized_key] = value

    return sanitized


def audit_log_data(log: AuditLog) -> dict[str, Any]:
    return {
        "id": log.id,
        "action": log.action,
        "resourceType": log.resource_type,
        "resourceId": log.resource_id,
        "metadata": json.loads(log.metadata_json),
        "ipAddress": log.ip_address,
        "userAgent": log.user_agent,
        "createdAt": normalize_utc(log.created_at).isoformat().replace("+00:00", "Z"),
    }


def record_audit_event(
    db: DbSession,
    request: Request,
    user_id: str,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_json=json.dumps(sanitize_audit_metadata(metadata), separators=(",", ":")),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        created_at=utc_now(),
    )
    db.add(log)
    return log
