import os
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
    "user-read-email"
)

# ---- Authenticate with Spotify ----
sp = spotipy.Spotify(auth_manager=SpotifyOAuth(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    redirect_uri=REDIRECT_URI,
    scope=scope
))

def get_spotify_client(token=None):
    if token:
        return spotipy.Spotify(auth=token)
    return spotipy.Spotify(auth_manager=sp)

def get_auth_url():
    return sp.get_authorize_url()

def get_token_from_code(code):
    return sp.get_access_token(code, as_dict=True)



'''

# ---- Emotion keywords mapping ----
emotion_query = emotion_utils.emotion_query_map.get(spotify_recc.detected_emotion, "chill lofi background")

# ---- Combine emotion with genres ----
combined_query = f"{emotion_query} {' '.join(genre_prefs)}"
print(f"\n🎧 Searching tracks for mood '{spotify_recc.detected_emotion.upper()}' with your genres: {', '.join(genre_prefs)}")
print("🔍 Search query:", combined_query)

# ---- Search for tracks ----
results = sp.search(q=combined_query, type="track", limit=10)

tracks = results["tracks"]["items"]
if not tracks:
    print("⚠️ No tracks found. Try different genres or emotion.")
    exit()

# ---- Show results ----
track_uris = []
print("\n🎶 Recommended Tracks:")
for idx, track in enumerate(tracks, 1):
    name = track["name"]
    artist = track["artists"][0]["name"]
    print(f"{idx}. {name} — {artist}")
    track_uris.append(track["uri"])

# ---- Check for active Spotify device ----
devices = sp.devices()["devices"]
if not devices:
    print("\n⚠️ No active Spotify devices found. Open Spotify on your phone, desktop, or web player and try again.")
    exit()

device_id = devices[0]["id"]
print(f"\n📱 Using device: {devices[0]['name']}")

# ---- Start playback ----
print("▶️ Starting playback...")
sp.start_playback(device_id=device_id, uris=track_uris)

# ---- Verify playback ----
time.sleep(5)
current = sp.current_playback()
if current and current.get("is_playing"):
    track_name = current["item"]["name"]
    artist_name = current["item"]["artists"][0]["name"]
    print(f"✅ Now playing: {track_name} — {artist_name}")
else:
    print("⚠️ Could not verify playback. Make sure Spotify is active and Premium is enabled.")

'''
