"""add ip_address and location to resumes

Revision ID: 59cb31b9b410
Revises: 0003_cv_info_store
Create Date: 2026-03-27 10:01:53.686046

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '59cb31b9b410'
down_revision: Union[str, None] = '0003_cv_info_store'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('resumes', sa.Column('ip_address', sa.String(length=45), nullable=True))
    op.add_column('resumes', sa.Column('location', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('resumes', 'location')
    op.drop_column('resumes', 'ip_address')
