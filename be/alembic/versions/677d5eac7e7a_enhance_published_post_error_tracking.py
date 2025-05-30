"""enhance_published_post_error_tracking

Revision ID: 677d5eac7e7a
Revises: e31ae7503220
Create Date: 2025-05-24 18:37:07.474030

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '677d5eac7e7a'
down_revision: Union[str, None] = 'e31ae7503220'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('published_posts', sa.Column('error_details', sa.JSON(), nullable=True))
    op.add_column('published_posts', sa.Column('retry_count', sa.Integer(), nullable=True))
    op.add_column('published_posts', sa.Column('next_retry_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('published_posts', sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True))
    op.add_column('published_posts', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('published_posts', 'updated_at')
    op.drop_column('published_posts', 'created_at')
    op.drop_column('published_posts', 'next_retry_at')
    op.drop_column('published_posts', 'retry_count')
    op.drop_column('published_posts', 'error_details')
    # ### end Alembic commands ###
