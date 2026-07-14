"""drop display_name from guest_list

Revision ID: 005
Revises: 7a82162b4392
Create Date: 2026-07-14

"""
from alembic import op
import sqlalchemy as sa


revision = '005'
down_revision = '7a82162b4392'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('guest_list', 'display_name')


def downgrade() -> None:
    op.add_column('guest_list', sa.Column('display_name', sa.Text(), nullable=True))
