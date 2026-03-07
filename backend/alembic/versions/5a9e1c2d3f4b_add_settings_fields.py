"""add settings fields to users and notes, add transactions table

Revision ID: 5a9e1c2d3f4b
Revises: 1f45c1d5bd9f
Create Date: 2026-03-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a9e1c2d3f4b'
down_revision: Union[str, Sequence[str], None] = '1f45c1d5bd9f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # User profile fields
    op.add_column('users', sa.Column('display_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('bio', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('university', sa.String(), nullable=True))
    op.add_column('users', sa.Column('department', sa.String(), nullable=True))

    # User privacy fields
    op.add_column('users', sa.Column('note_default_visibility', sa.String(), nullable=True, server_default='private'))
    op.add_column('users', sa.Column('show_on_explore', sa.Boolean(), nullable=True, server_default='true'))

    # User wallet field
    op.add_column('users', sa.Column('paps_balance', sa.Integer(), nullable=True, server_default='0'))

    # Note visibility field
    op.add_column('notes', sa.Column('visibility', sa.String(), nullable=True, server_default='private'))

    # Transactions table
    op.create_table(
        'transactions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_transactions_user_id', 'transactions', ['user_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_transactions_user_id', table_name='transactions')
    op.drop_table('transactions')
    op.drop_column('notes', 'visibility')
    op.drop_column('users', 'paps_balance')
    op.drop_column('users', 'show_on_explore')
    op.drop_column('users', 'note_default_visibility')
    op.drop_column('users', 'department')
    op.drop_column('users', 'university')
    op.drop_column('users', 'bio')
    op.drop_column('users', 'display_name')
