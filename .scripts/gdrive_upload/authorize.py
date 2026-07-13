"""
Run once to authorize this machine against Google Drive/Slides.
Opens a browser for consent, then saves a reusable token to token.json.
"""
import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_SECRET_PATH = os.path.join(
    os.path.expanduser("~"),
    "Downloads",
    "client_secret_200731304603-j1otf8gjfg1vgt2dftn7e1i2f2a8ju20.apps.googleusercontent.com.json",
)
TOKEN_PATH = os.path.join(SCRIPT_DIR, "token.json")

SCOPES = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/presentations",
]


def main():
    flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_PATH, SCOPES)
    creds = flow.run_local_server(port=0)
    with open(TOKEN_PATH, "w") as f:
        f.write(creds.to_json())
    print(f"Token saved to {TOKEN_PATH}")


if __name__ == "__main__":
    main()
