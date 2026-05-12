from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DbSession

from app.audit.models import AuditLog
from app.audit.schemas import AuditEventPayload
from app.audit.service import audit_log_data, record_audit_event
from app.auth.dependencies import active_session_from_cookie
from app.db import get_db
from app.responses import error_response, ok_response
from app.settings import Settings, get_settings


router = APIRouter(prefix="/api/audit", tags=["audit"])


def current_user_id(request: Request, db: DbSession, settings: Settings) -> str | Response:
    session = active_session_from_cookie(request, db, settings)
    if session is None:
        return error_response(request, "UNAUTHENTICATED", "Authentication required", 401)
    return session.user_id


@router.get("/logs")
def list_audit_logs(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=100),
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    user_id = current_user_id(request, db, settings)
    if isinstance(user_id, Response):
        return user_id

    query = select(AuditLog).where(AuditLog.user_id == user_id).order_by(AuditLog.created_at.desc())
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    logs = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()

    return ok_response(
        request,
        {
            "logs": [audit_log_data(log) for log in logs],
            "pagination": {"page": page, "pageSize": page_size, "total": total},
        },
    )


@router.post("/events")
def create_audit_event(
    request: Request,
    payload: AuditEventPayload,
    db: DbSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> Response:
    user_id = current_user_id(request, db, settings)
    if isinstance(user_id, Response):
        return user_id

    log = record_audit_event(
        db,
        request,
        user_id=user_id,
        action=payload.action,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        metadata=payload.metadata,
    )
    db.commit()
    db.refresh(log)
    return ok_response(request, {"log": audit_log_data(log)}, status_code=201)
