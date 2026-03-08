"""add unlocked_notes and paps models

Revision ID: c8f921d3f4b5
Revises: 966d0ac93abf
Create Date: 2026-03-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8f921d3f4b5'
down_revision: Union[str, Sequence[str], None] = '966d0ac93abf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add paps_price and requires_pin to notes
    op.add_column('notes', sa.Column('paps_price', sa.Integer(), nullable=True, server_default='0'))
    op.add_column('notes', sa.Column('requires_pin', sa.Boolean(), nullable=True, server_default='false'))

    # Create unlocked_notes table
    op.create_table(
        'unlocked_notes',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('note_id', sa.Integer(), sa.ForeignKey('notes.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index('ix_unlocked_notes_user_id', 'unlocked_notes', ['user_id'])
    op.create_index('ix_unlocked_notes_note_id', 'unlocked_notes', ['note_id'])


def downgrade() -> None:
    op.drop_index('ix_unlocked_notes_note_id', table_name='unlocked_notes')
    op.drop_index('ix_unlocked_notes_user_id', table_name='unlocked_notes')
    op.drop_table('unlocked_notes')
    op.drop_column('notes', 'requires_pin')
    op.drop_column('notes', 'paps_price')
