"""add is_profile_public

Revision ID: 1c84584e33be
Revises: c8f921d3f4b5
Create Date: 2026-03-09 13:18:44.110782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1c84584e33be'
down_revision: Union[str, Sequence[str], None] = 'c8f921d3f4b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('is_profile_public', sa.Boolean(), server_default='true', nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'is_profile_public')
