"""add shap_explanation to loan_applications

Revision ID: a1b2c3d4e5f6
Revises: fc577e694ccf
Create Date: 2025-05-27

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'fc577e694ccf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('loan_applications', sa.Column('shap_explanation', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('loan_applications', 'shap_explanation')
