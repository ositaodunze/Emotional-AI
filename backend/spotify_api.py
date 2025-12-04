import os
import json
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

# ---- Load env variables ----
load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

if not CLIENT_ID or not CLIENT_SECRET or not REDIRECT_URI:
    raise ValueError("Missing Spotify env variables")

# ---- Scopes ----
scope = (
    "user-read-playback-state "
    "user-modify-playback-state "
    "user-read-currently-playing "
    "user-read-private "
    "user-read-email "
    "user-top-read "
    "playlist-modify-public "
    "playlist-modify-private "
    "user-read-playback-position "
    "user-library-read "
    "streaming"
)

# ---- OAuth Manager ----
sp_oauth = SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=scope,
    cache_path=None   # 🚫 Disable ALL caching
)

# ---- Login URL ----
def get_auth_url():
    return sp_oauth.get_authorize_url()

# ---- Exchange CODE → TOKEN (NO CACHE, NO REFRESH) ----
def get_token_from_code(code: str):
    """
    Exchange authorization code for access + refresh tokens.
    This bypasses all cache and refresh logic.
    """
    token_info = sp_oauth._request_token(code)
    return token_info

# ---- Refresh Token ----
def refresh_access_token(refresh_token: str):
    return sp_oauth.refresh_access_token(refresh_token)

# ---- Create Spotify client ----
def get_spotify_client(token_info_json):
    if not token_info_json:
        raise ValueError("token_info_json is missing")

    token_info = json.loads(token_info_json) if isinstance(token_info_json, str) else token_info_json

    if sp_oauth.is_token_expired(token_info):
        print("🔄 Refreshing Spotify token...")
        token_info = sp_oauth.refresh_access_token(token_info["refresh_token"])

    return spotipy.Spotify(auth=token_info["access_token"])
