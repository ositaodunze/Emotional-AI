from dotenv import load_dotenv
load_dotenv()

def start_playback(sp, uris):
    devices = sp.devices()["devices"]
    web_player = next((d for d in devices if d["type"] == "Computer"), None)

    if not web_player:
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
