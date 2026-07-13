"""
Upload a local .pptx file to Google Drive, converting it to Google Slides.
Usage: python upload.py <path-to-pptx> [--name "Deck name"] [--folder <folder_id>]

Streams the file straight from disk to Drive's upload endpoint;
no file bytes ever pass through the assistant's context.
"""
import argparse
import os
import sys

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_PATH = os.path.join(SCRIPT_DIR, "token.json")

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/presentations",
]


def get_credentials():
    if not os.path.exists(TOKEN_PATH):
        sys.exit("No token.json found. Run authorize.py first.")
    creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_PATH, "w") as f:
            f.write(creds.to_json())
    return creds


def upload(pptx_path: str, name: str | None, folder_id: str | None):
    if not os.path.isfile(pptx_path):
        sys.exit(f"File not found: {pptx_path}")

    creds = get_credentials()
    drive = build("drive", "v3", credentials=creds)

    file_metadata = {
        "name": name or os.path.splitext(os.path.basename(pptx_path))[0],
        "mimeType": "application/vnd.google-apps.presentation",
    }
    if folder_id:
        file_metadata["parents"] = [folder_id]

    media = MediaFileUpload(
        pptx_path,
        mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        resumable=True,
    )

    request = drive.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, webViewLink",
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Uploaded {int(status.progress() * 100)}%")

    print(f"File ID: {response['id']}")
    print(f"URL: {response['webViewLink']}")
    return response


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("pptx_path")
    parser.add_argument("--name", default=None)
    parser.add_argument("--folder", default=None)
    args = parser.parse_args()
    upload(args.pptx_path, args.name, args.folder)
