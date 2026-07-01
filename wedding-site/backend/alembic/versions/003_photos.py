"""photos table

Revision ID: 003
Revises: 002
Create Date: 2026-07-01
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    photo_status_enum = sa.Enum("visible", "hidden", name="photo_status_enum")
    op.create_table(
        "photos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("uploader_name", sa.Text, nullable=False),
        sa.Column("message", sa.Text),
        sa.Column("storage_key", sa.Text, nullable=False),
        sa.Column("thumb_key", sa.Text, nullable=False),
        sa.Column(
            "status",
            photo_status_enum,
            nullable=False,
            server_default="visible",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("photos")
    sa.Enum(name="photo_status_enum").drop(op.get_bind(), checkfirst=False)
