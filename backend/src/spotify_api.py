import os
import time
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

print("✅ Successfully authenticated with Spotify!")

# ---- Confirm user info ----
me = sp.current_user()
print(f"👤 Logged in as: {me['display_name']} ({me['email']})")
print(f"💳 Account type: {me['product'].upper()}")

if me["product"].lower() != "premium":
    print("⚠️ Warning: Playback control may not work on free accounts.")

# ---- Ask for user preferences ----
print("\n🎶 Welcome to the Emotion-Driven Music Player!")
print("Pick 3 genres you like most (examples: pop, rock, lofi, jazz, hip-hop, edm, classical):")
genre_prefs = input("➡️ Enter 3 genres separated by commas: ").strip().lower().split(",")

# Clean and validate genre input
genre_prefs = [g.strip() for g in genre_prefs if g.strip()]
if len(genre_prefs) == 0:
    genre_prefs = ["pop", "lofi", "edm"]  # default fallback
elif len(genre_prefs) < 3:
    while len(genre_prefs) < 3:
        genre_prefs.append("pop")

print(f"✅ Genres selected: {', '.join(genre_prefs)}")

# ---- Ask user for current emotion ----
print("\n😊 Emotions you can try: happy, sad, angry, calm, neutral, surprised")
detected_emotion = input("➡️ How are you feeling today? ").strip().lower()

# ---- Emotion keywords mapping ----
emotion_query_map = {
    "happy": "happy upbeat positive feel-good",
    "sad": "sad emotional acoustic mellow",
    "angry": "angry intense heavy rock metal",
    "calm": "calm chill relaxing background",
    "neutral": "lofi chill background",
    "surprised": "energetic edm upbeat dance"
}

emotion_query = emotion_query_map.get(detected_emotion, "chill lofi background")

# ---- Combine emotion with genres ----
combined_query = f"{emotion_query} {' '.join(genre_prefs)}"
print(f"\n🎧 Searching tracks for mood '{detected_emotion.upper()}' with your genres: {', '.join(genre_prefs)}")
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


