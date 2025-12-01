import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

# ---- Load environment variables ----
load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

# ---- Scopes ----
scope = (
    "user-read-playback-state "
    "user-modify-playback-state "
    "user-read-currently-playing "
    "user-read-private "
    "user-read-email "
    "user-top-read"
    "playlist-modify-public "
    "playlist-modify-private"
)

# ---- Global OAuth manager ----
sp_oauth = SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=scope
)

# ---- Authorization URL for login ----
def get_auth_url():
    return sp_oauth.get_authorize_url()


# ---- Exchange authorization code for token info ----
def get_token_from_code(code):
    return sp_oauth.get_access_token(code, as_dict=True)


# ---- Create Spotify client (auto-refresh if expired) ----
def get_spotify_client(token_info_json):
    if not token_info_json:
        raise ValueError("No token info provided")

    # Load token info (string or dict)
    token_info = (
        json.loads(token_info_json)
        if isinstance(token_info_json, str)
        else token_info_json
    )

    # Refresh if expired
    if sp_oauth.is_token_expired(token_info):
        print("🔄 Refreshing Spotify token...")
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])

    access_token = token_info["access_token"]
    return spotipy.Spotify(auth=access_token)
