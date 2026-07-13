"""
Move one or more Google Drive files to trash by file ID.
Usage: python delete.py <file_id> [<file_id> ...]
"""
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from upload import SCOPES, TOKEN_PATH, get_credentials


def trash(file_id: str):
    creds = get_credentials()
    drive = build("drive", "v3", credentials=creds)
    drive.files().update(fileId=file_id, body={"trashed": True}).execute()
    print(f"Trashed {file_id}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python delete.py <file_id> [<file_id> ...]")
    for fid in sys.argv[1:]:
        trash(fid)
