"""Pydantic schemas for the Migration Pipeline API."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class MigrationJobOut(BaseModel):
    id: UUID
    job_type: str
    status: str
    total_items: int | None
    processed_items: int
    failed_items: int
    result_manifest: list
    error_log: list
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MigrationJobListOut(BaseModel):
    items: list[MigrationJobOut]
    total: int


class DiscoverRequest(BaseModel):
    """Optional parameters for a Drive discovery scan."""

    folder_id: str | None = None   # Override root folder; defaults to env DRIVE_FOLDER_ID
    dry_run: bool = False           # Scan only, do not persist


class LoadRequest(BaseModel):
    """Trigger a load from a completed discovery job."""

    job_id: UUID
    approved_indices: list[int] | None = None  # None = load all discovered items
