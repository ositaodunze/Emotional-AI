from dotenv import load_dotenv
import spotify_api
from emotion_utils import get_emotion_query


load_dotenv()

def get_spotify_recommendations(detected_emotion: str, genres: list[str] = None):
    """Return recommended tracks from Spotify based on emotion + genres."""
    detected_emotion = detected_emotion.lower()
    emotion_query = get_emotion_query(detected_emotion)

    genres = genres or ["pop", "lofi", "edm"]
    query = f"{emotion_query} {' '.join(genres)}"

    results = spotify_api.sp.search(q=query, type="track", limit=10)
    tracks = results["tracks"]["items"]

    recommendations = [
        {
            "name": t["name"],
            "artist": t["artists"][0]["name"],
            "url": t["external_urls"]["spotify"]
        }
        for t in tracks
    ]

    return recommendations

def start_playback(sp, uris):
    devices = sp.devices()["devices"]
    if not devices:
        return {"error": "No active Spotify devices found."}

    device_id = devices[0]["id"]
    sp.start_playback(device_id=device_id, uris=uris)
    return {"message": "Playback started"}

def get_current_track(sp):
    current = sp.current_playback()
    if current and current.get("is_playing"):
        item = current["item"]
        return {
            "track_name": item["name"],
            "artist": item["artists"][0]["name"],
            "album_art": item["album"]["images"][0]["url"],
        }
    return {"message": "Nothing is currently playing"}
