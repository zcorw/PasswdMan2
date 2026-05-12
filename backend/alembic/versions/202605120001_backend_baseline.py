"""backend baseline

Revision ID: 202605120001
Revises:
Create Date: 2026-05-12 23:30:00.000000
"""
from typing import Sequence, Union

revision: str = "202605120001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
