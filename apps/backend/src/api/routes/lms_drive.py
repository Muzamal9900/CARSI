"""
CARSI LMS Google Drive Routes

GET  /api/lms/drive/files              — list files in root folder (instructor/admin)
GET  /api/lms/drive/files/{file_id}    — get file metadata (instructor/admin)
GET  /api/lms/drive/folders/{folder_id}/files — list files in a specific subfolder

Returns empty results when Google Drive integration is disabled.
"""

from fastapi import APIRouter, Depends

from src.api.deps_lms import require_role
from src.config.settings import get_settings
from src.db.lms_models import LMSUser
from src.services.google_drive import DriveService

router = APIRouter(prefix="/api/lms/drive", tags=["lms-drive"])


def _get_drive_service() -> DriveService:
    """FastAPI dependency — create a DriveService from current settings."""
    s = get_settings()
    return DriveService(
        credentials_file=s.google_drive_credentials_file,
        folder_id=s.google_drive_folder_id,
    )


@router.get("/files")
async def list_drive_files(
    folder_id: str | None = None,
    current_user: LMSUser = Depends(require_role(["instructor", "admin"])),
    drive: DriveService = Depends(_get_drive_service),
) -> list[dict]:
    """
    List files in the configured Drive root folder or a specific subfolder.
    Returns an empty list when Drive integration is disabled.
    """
    return drive.list_files_in_folder(folder_id=folder_id)


@router.get("/files/{file_id}")
async def get_drive_file(
    file_id: str,
    current_user: LMSUser = Depends(require_role(["instructor", "admin"])),
    drive: DriveService = Depends(_get_drive_service),
) -> dict:
    """
    Retrieve metadata for a single Drive file.
    Returns an empty dict when Drive integration is disabled.
    """
    metadata = drive.get_file_metadata(file_id)
    return metadata or {}


@router.get("/folders/{folder_id}/files")
async def list_folder_files(
    folder_id: str,
    current_user: LMSUser = Depends(require_role(["instructor", "admin"])),
    drive: DriveService = Depends(_get_drive_service),
) -> list[dict]:
    """List files inside a specific Drive folder (e.g. a course content folder)."""
    return drive.list_files_in_folder(folder_id=folder_id)
