from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session as DbSession

from app.auth.models import Session
from app.auth.security import hash_session_token, normalize_utc, utc_now
from app.settings import Settings


def active_session_from_cookie(
    request: Request,
    db: DbSession,
    settings: Settings,
) -> Session | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None

    session = db.scalar(
        select(Session)
        .where(Session.token_hash == hash_session_token(token))
        .where(Session.status == "active")
    )
    if session is None:
        return None

    if normalize_utc(session.expires_at) <= utc_now() or session.user.status != "active":
        session.status = "expired"
        db.commit()
        return None

    return session
