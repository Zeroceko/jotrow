"""enable_rls_on_all_tables

Revision ID: ec36f3689e37
Revises: 1c84584e33be
Create Date: 2026-03-11 17:55:33.877892

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec36f3689e37'
down_revision: Union[str, Sequence[str], None] = '1c84584e33be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TABLE alembic_version ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE courses ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE note_images ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE notes ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE unlocked_notes ENABLE ROW LEVEL SECURITY;")


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("ALTER TABLE alembic_version DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE courses DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE note_images DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE notes DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE users DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;")
    op.execute("ALTER TABLE unlocked_notes DISABLE ROW LEVEL SECURITY;")
