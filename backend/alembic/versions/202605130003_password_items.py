"""password items

Revision ID: 202605130003
Revises: 202605130002
Create Date: 2026-05-13 02:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "202605130003"
down_revision: Union[str, None] = "202605130002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_items",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("vault_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=True),
        sa.Column("username", sa.String(length=320), nullable=True),
        sa.Column("encrypted_secret", sa.Text(), nullable=False),
        sa.Column("favorite", sa.Boolean(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["vault_id"], ["vaults.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_password_items_vault_id"), "password_items", ["vault_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_password_items_vault_id"), table_name="password_items")
    op.drop_table("password_items")
