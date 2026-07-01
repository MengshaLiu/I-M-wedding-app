"""Drop timeline_events and site_content tables (data now hardcoded)

Revision ID: 002
Revises: 001
Create Date: 2026-07-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("timeline_events")
    op.drop_table("site_content")
    sa.Enum(name="visibility_enum").drop(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    visibility_enum = sa.Enum("all", "full_only", name="visibility_enum")
    op.create_table(
        "timeline_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("starts_at", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("location", sa.Text),
        sa.Column("visibility", visibility_enum, nullable=False, server_default="all"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_table(
        "site_content",
        sa.Column("key", sa.Text, primary_key=True),
        sa.Column("value", JSONB, nullable=False),
    )
