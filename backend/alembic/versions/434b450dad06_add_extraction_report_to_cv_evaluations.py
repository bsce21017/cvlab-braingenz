"""add extraction_report to cv_evaluations

Revision ID: 434b450dad06
Revises: 59cb31b9b410
Create Date: 2026-04-09 14:38:08.762630

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '434b450dad06'
down_revision: Union[str, None] = '59cb31b9b410'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('cv_evaluations', sa.Column('extraction_report', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('cv_evaluations', 'extraction_report')
