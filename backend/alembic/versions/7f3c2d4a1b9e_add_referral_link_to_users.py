"""add_referral_link_to_users

Revision ID: 7f3c2d4a1b9e
Revises: ec36f3689e37
Create Date: 2026-03-13 01:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f3c2d4a1b9e"
down_revision: Union[str, Sequence[str], None] = "ec36f3689e37"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("referred_by_user_id", sa.Integer(), nullable=True))
        batch_op.create_index("ix_users_referred_by_user_id", ["referred_by_user_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_users_referred_by_user_id_users",
            "users",
            ["referred_by_user_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_constraint("fk_users_referred_by_user_id_users", type_="foreignkey")
        batch_op.drop_index("ix_users_referred_by_user_id")
        batch_op.drop_column("referred_by_user_id")
