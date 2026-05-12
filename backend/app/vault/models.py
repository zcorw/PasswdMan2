from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def uuid_value() -> str:
    return str(uuid4())


class Vault(Base):
    __tablename__ = "vaults"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_value)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False, default="Personal Vault")
    encrypted_vault_key: Mapped[str] = mapped_column(Text, nullable=False)
    encrypted_data: Mapped[str] = mapped_column(Text, nullable=False, default="")
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    user = relationship("User")
