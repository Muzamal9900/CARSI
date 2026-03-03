"""
CARSI Google Drive Service

Wraps the Google Drive API v3 for course content management.
Uses service account credentials stored in a JSON key file.

In development without credentials (FEATURE_GOOGLE_DRIVE=false),
the service operates in "disabled" mode and returns empty results
rather than crashing — allowing the rest of the app to work normally.
"""

import os
from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from src.utils import get_logger

logger = get_logger(__name__)

_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

_DRIVE_FILE_FIELDS = "id, name, mimeType, size, webViewLink, createdTime"
_DRIVE_META_FIELDS = "id, name, mimeType, size, webViewLink, thumbnailLink"


class DriveService:
    """
    Thin wrapper around the Google Drive API.

    Pass ``credentials_file=""`` or ``folder_id=""`` to activate disabled mode —
    all methods return empty/None without raising.
    """

    def __init__(self, credentials_file: str, folder_id: str) -> None:
        self._folder_id = folder_id
        self._service: Any = None

        if not credentials_file or not os.path.isfile(credentials_file):
            logger.info(
                "DriveService: no credentials file found — running in disabled mode",
                credentials_file=credentials_file or "(empty)",
            )
            self.is_disabled = True
            return

        try:
            creds = service_account.Credentials.from_service_account_file(
                credentials_file, scopes=_SCOPES
            )
            self._service = build("drive", "v3", credentials=creds, cache_discovery=False)
            self.is_disabled = False
            logger.info("DriveService: initialised with service account credentials")
        except Exception as exc:
            logger.warning("DriveService: failed to initialise — disabled", error=str(exc))
            self.is_disabled = True

    # ---------------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------------

    def list_files_in_folder(self, folder_id: str | None = None) -> list[dict]:
        """
        Return files inside *folder_id* (or the configured root folder).
        Returns an empty list in disabled mode or on API error.
        """
        if self.is_disabled:
            return []

        target = folder_id or self._folder_id
        if not target:
            return []

        try:
            result = (
                self._service.files()
                .list(
                    q=f"'{target}' in parents and trashed=false",
                    fields=f"files({_DRIVE_FILE_FIELDS})",
                    orderBy="name",
                    pageSize=100,
                )
                .execute()
            )
            return result.get("files", [])
        except HttpError as exc:
            logger.error("DriveService.list_files_in_folder error", error=str(exc))
            return []

    def get_file_metadata(self, file_id: str) -> dict | None:
        """
        Return metadata for a single file. Returns ``None`` in disabled mode or on error.
        """
        if self.is_disabled:
            return None

        try:
            return (
                self._service.files()
                .get(fileId=file_id, fields=_DRIVE_META_FIELDS)
                .execute()
            )
        except HttpError as exc:
            logger.error("DriveService.get_file_metadata error", file_id=file_id, error=str(exc))
            return None

    def get_file_download_url(self, file_id: str) -> str | None:
        """Return a direct download URL for a file. Returns ``None`` in disabled mode."""
        if self.is_disabled:
            return None
        return f"https://drive.google.com/uc?export=download&id={file_id}"
