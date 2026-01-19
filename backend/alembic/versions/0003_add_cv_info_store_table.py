"""Add cv_info_store table for optimized CV storage

Revision ID: 0003_cv_info_store
Revises: 0002_claims
Create Date: 2025-01-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0003_cv_info_store'
down_revision: Union[str, None] = '0002_claims'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create metadata_status enum
    metadata_status_enum = sa.Enum('PENDING', 'DONE', 'ERROR', name='metadatastatus')
    metadata_status_enum.create(op.get_bind(), checkfirst=True)

    # Create cv_info_store table
    op.create_table(
        'cv_info_store',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('text_s3_file_path', sa.String(length=1000), nullable=True),
        sa.Column('pdf_s3_file_path', sa.String(length=1000), nullable=True),
        sa.Column('date_added', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('metadata_status', sa.Enum('PENDING', 'DONE', 'ERROR', name='metadatastatus'), nullable=False, server_default='PENDING'),
        sa.Column('metadata_extracted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('extracted_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('metadata_model', sa.String(length=100), nullable=True),
        sa.Column('metadata_error', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cv_info_store_id'), 'cv_info_store', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_cv_info_store_id'), table_name='cv_info_store')
    op.drop_table('cv_info_store')
    sa.Enum('PENDING', 'DONE', 'ERROR', name='metadatastatus').drop(op.get_bind())
