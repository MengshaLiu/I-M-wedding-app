"""add dietary and special_requirements to guest_list

Revision ID: 006
Revises: 005
Create Date: 2026-07-21

"""
from alembic import op
import sqlalchemy as sa


revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('guest_list', sa.Column('dietary', sa.Text(), nullable=True))
    op.add_column('guest_list', sa.Column('special_requirements', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('guest_list', 'special_requirements')
    op.drop_column('guest_list', 'dietary')
