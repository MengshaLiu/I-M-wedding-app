"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-30
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    tier_enum = sa.Enum("full", "reception", name="tier_enum")
    visibility_enum = sa.Enum("all", "full_only", name="visibility_enum")

    op.create_table(
        "tables",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("label", sa.Text, nullable=False),
        sa.Column("note", sa.Text),
    )

    op.create_table(
        "guest_list",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("display_name", sa.Text, nullable=False),
        sa.Column("tier", tier_enum, nullable=False),
        sa.Column("table_id", UUID(as_uuid=True), sa.ForeignKey("tables.id")),
    )

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


def downgrade() -> None:
    op.drop_table("site_content")
    op.drop_table("timeline_events")
    op.drop_table("guest_list")
    op.drop_table("tables")
    sa.Enum(name="visibility_enum").drop(op.get_bind(), checkfirst=False)
    sa.Enum(name="tier_enum").drop(op.get_bind(), checkfirst=False)
