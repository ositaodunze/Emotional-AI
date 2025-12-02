from fastapi import FastAPI,Request,Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.responses import StreamingResponse 
from io import BytesIO 
from pydantic import BaseModel
import spotify_recc
import spotify_api
import json
import requests #useful for recommendations from reccobeats
from app.startup import verify_load_model
from app.chatbot import get_chat_response, detect_language
from app.voice_service import get_voice_service  
from contextlib import asynccontextmanager
import pandas as pd
from typing import Optional, List
from llm_classification import (expand_similar_artists,
    get_artist_feature_profile,
    combine_artist_profiles,
    blend_features,
    suggest_tracks_for_artist_and_mood)
import difflib

RECCOBEATS_BASE = "https://api.reccobeats.com/v1/track/recommendation"

class EmotionInput(BaseModel):
    emotion: str
    genres: list[str] | None = None


#model
@asynccontextmanager
async def lifespan(app: FastAPI):
    ohe, scaler_y, music_model = verify_load_model()
    app.state.ohe = ohe
    app.state.scaler_y = scaler_y
    app.state.music_model = music_model
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message": "Welcome to FeedMusic."}

@app.get("/spotify/login")
def login():
    return RedirectResponse(spotify_api.get_auth_url())

@app.get("/callback")
def callback(request: Request):
    code = request.query_params.get("code")
    token_info = spotify_api.get_token_from_code(code)
    response = RedirectResponse("http://127.0.0.1:5173/")
    response.set_cookie(
        key="spotify_token_info",
        value=json.dumps(token_info),
        httponly=True,
        samesite="lax",
        secure=False
    )
    return response

@app.get("/spotify/me")
def get_user(request: Request):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code = 401)
    sp = spotify_api.get_spotify_client(token_info_json)
    me = sp.current_user()
    return {"display_name": me["display_name"], "email": me["email"], "product": me["product"]}

    
def get_track_genres(sp,track_id):
    track = sp.track(track_id)
    artist_ids = [a["id"] for a in track["artists"]]
    artists = sp.artists(artist_ids)
    raw = {g for a in artists["artists"] for g in a.get("genres", [])}
    return raw

def get_spotify_seed_tracks(sp, genres=None):
    """Get seed track IDs from user's top tracks, optionally filtered by genres."""
    try:
        user_top = sp.current_user_top_tracks(limit=50)
        all_tracks = user_top.get("items", [])
        
        if not genres:
            return [track['id'] for track in all_tracks[:5]]
        
        artist_ids = set()
        for track in all_tracks:
            for artist in track['artists']:
                artist_ids.add(artist['id'])
        
        # Spotify API limit: max 50 artist IDs per request
        artist_ids_list = list(artist_ids)
        
        # Batch requests if we have more than 50 artists
        artist_genre_map = {}
        if len(artist_ids_list) > 50:
            # Process in batches of 50
            for i in range(0, len(artist_ids_list), 50):
                batch = artist_ids_list[i:i+50]
                artists_data = sp.artists(batch)
                for artist in artists_data['artists']:
                    artist_genre_map[artist['id']] = set(artist.get('genres', []))
        else:
            artists_data = sp.artists(artist_ids_list)
            for artist in artists_data['artists']:
                artist_genre_map[artist['id']] = set(artist.get('genres', []))
            
        filtered_seed_ids = []
        target_genres = set(genres)
        
        for track in all_tracks:
            track_artists = [a['id'] for a in track.get('artists', [])]
            track_genres = set()
            for artist_id in track_artists:
                track_genres.update(artist_genre_map.get(artist_id, set()))
            
            if track_genres & target_genres:  # If any genre matches
                filtered_seed_ids.append(track['id'])
                if len(filtered_seed_ids) >= 5:
                    break
        
        return filtered_seed_ids[:5] if filtered_seed_ids else [track['id'] for track in all_tracks[:5]]
    except Exception as e:
        print(f"Error getting seed tracks: {e}")
        return []

@app.get("/api/top-artists")
def get_top_artists(request: Request):
    token_json = request.cookies.get("spotify_token_info")
    if not token_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_json)

    top_artists = sp.current_user_top_artists(limit=50)
    items = []

    for artist in top_artists["items"]:
        items.append({
            "id": artist["id"],
            "name": artist["name"],
            "image": artist["images"][0]["url"] if artist["images"] else ""
        })

    return {"artists": items}

        
def predict_track_features(app,mood):
    ohe = app.state.ohe 
    scaler_y = app.state.scaler_y
    music_model = app.state.music_model

    mood_df = pd.DataFrame([mood],columns=['redefined_mood'])
    X = ohe.transform(mood_df)
    pred_scaled = music_model.predict(X)
    features = scaler_y.inverse_transform(pred_scaled)[0] 
    return features 

def call_reccobeats(feature_params,seed_ids,limit=20):
    filtered_keys = {"energy", "valence","tempo","loudness", "danceability", "acousticness", "instrumentalness", "liveness", "speechiness"}
    filtered_features = {}
    for k, v in feature_params.items():
        if k in filtered_keys:
            if k == "tempo":
                filtered_features[k] = int(round(v))
            else:
                filtered_features[k] = round(v, 4)

    seeds = ",".join(seed_ids[:5])
    payload ={
        "size":limit,"seeds":seeds, **filtered_features
    }

    try:
        response = requests.get(RECCOBEATS_BASE,params=payload,timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("ReccoBeats Error", e)

def convert_to_reccobeats(predicted_features,feature_names):
    params = {}
    RANGE_0_1_FEATURES = ['energy', 'valence']

    for idx, col in enumerate(feature_names):
        value = float(predicted_features[idx])
        constrained_value = value

        if col in RANGE_0_1_FEATURES:
            constrained_value = max(0.0, min(1.0,value))
        elif col == "loudness":
            constrained_value = max(-60.0, min(0.0, value))
        elif col == "tempo":
            constrained_value = int(round(value))
            constrained_value = max(50, min(250, constrained_value))
        params[col] = constrained_value

    return params

def clean_artist_list(names: list[str]) -> list[str]:
    """Normalize LLM artist list: strip markdown, quotes, junk, and dedupe."""
    cleaned = []
    for raw in names or []:
        if not raw:
            continue
        n = str(raw).strip()
        # Drop markdown fences and obvious junk
        if n.startswith("```") or n.lower().startswith("python"):
            continue
        # Strip list syntax and quotes
        n = n.strip("[]',\" ").strip()
        if not n:
            continue
        cleaned.append(n)

    # De-duplicate while preserving order (case-insensitive)
    seen = set()
    result = []
    for n in cleaned:
        key = n.lower()
        if key not in seen:
            seen.add(key)
            result.append(n)
    return result


def is_close_match(name: str, candidates: list[str], threshold=0.6):
    """Return True if artist name is similar enough to preferred or LLM-expanded names."""
    name = name.lower()
    for c in candidates:
        ratio = difflib.SequenceMatcher(None, name, c).ratio()
        if ratio >= threshold:
            return True
        if c in name or name in c:
            return True
    return False

@app.get("/api/recommendation")
async def get_recommendations(request: Request,emotion: str = Query(..., description="The detected or confirmed emotion"),
                               artists: Optional[List[str]] = Query(None, description="Selected artist IDs from user")):

    print("Emotion:",emotion)
    print("Selected artists:",artists)
    print("====================")

    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    
    sp = spotify_api.get_spotify_client(token_info_json)

    predicted_features = predict_track_features(app,emotion)
    scaler_y = request.app.state.scaler_y
    numeric_columns = scaler_y.feature_names_in_
    feature_params = convert_to_reccobeats(predicted_features, numeric_columns)


    selected_artist_ids = list(artists or [])
    selected_artist_names = []

    if selected_artist_ids:
            try:
                sp_artists = sp.artists(selected_artist_ids)["artists"]
                selected_artist_names = [a["name"] for a in sp_artists]
            except:
                selected_artist_names = []
    print("User-selected artists:", selected_artist_names)

    expanded_artists_raw = []
    if selected_artist_names:
        expanded_artists_raw = expand_similar_artists(selected_artist_names)
    expanded_artists = clean_artist_list(expanded_artists_raw)
    print("LLM expanded similar artists:", expanded_artists)

    artist_profiles = []
    for name in expanded_artists[:10]:
        profile = get_artist_feature_profile(name)
        if profile:
            artist_profiles.append(profile)
    
    artist_vec = combine_artist_profiles(artist_profiles)
    final_features = feature_params

    if artist_vec:
        final_features = blend_features(feature_params, artist_vec, emotion_weight=0.7)
    print("Final blended features:", final_features)

    #build track  list 
    seed_tracks = []
    for artist_id in selected_artist_ids:
        try:
            top = sp.artist_top_tracks(artist_id, country="US")
            for t in top.get("tracks", [])[:3]:
                if t and t.get("id"):
                    seed_tracks.append(t["id"])
        except:
            continue

    for name in expanded_artists[:10]:
        try:
            search = sp.search(q=name, type="artist",limit=1)
            items = search["artists"]["items"]
            if not items:
                continue

            llm_artist_id = items[0]["id"]
            top = sp.artist_top_tracks(llm_artist_id, country="US")
            if top["tracks"]:
                first_track = top["tracks"][0]
                if first_track and first_track.get("id"):
                    seed_tracks.append(top["tracks"][0]["id"])
        except:
            continue

    if not seed_tracks:
        try:
            user_top = sp.current_user_top_tracks(limit=20)
            seed_tracks = [t["id"] for t in user_top["items"][:5]]
        except:
            pass

    optimized_seed_tracks = list(dict.fromkeys(seed_tracks))[:5]
    print(" Final Seed Tracks:", optimized_seed_tracks)

    rb_response = call_reccobeats(final_features,limit=40,seed_ids = optimized_seed_tracks)
    if not rb_response or "content" not in rb_response:
        return JSONResponse({"error": "ReccoBEats returned no tracks"}, status_code=500)
    
    
    #use results to search on spotify
    final_recommendations = []
    ranked_high = []
    ranked_medium = [] 
    ranked_low = []
    preferred_list = [a.lower() for a in selected_artist_names]
    similar_list = [a.lower() for a in expanded_artists]
    
    for track in rb_response["content"]:
        try:
            spotify_url = track.get("href")
            if not spotify_url or "track/" not in spotify_url:
                continue
            
            spotify_id = spotify_url.split("track/")[-1].split("?")[0].strip()
            meta = sp.track(spotify_id)

            name = track.get("trackTitle", "Unknown Track")
            artists_data = track.get("artists",[])
            primary_artist_name = artists_data[0].get("name") if artists_data else "Unknown Artist"
            image = track.get("album","images",0,"url")

            spotify_artists = [a["name"] for a in meta.get("artists", []) if a.get("name")]
            spotify_artists_lower = [n.lower() for n in spotify_artists]

            item = {
                "name": name,
                "artist": primary_artist_name,
                "artists_all": spotify_artists,
                "url": spotify_url,
                "uri": f"spotify:track:{spotify_id}",
                "duration_ms": meta.get("duration_ms", 0),
                "image":image
                }
            
            is_preferred = any(is_close_match(a, preferred_list) for a in spotify_artists_lower)
            is_similar = any(is_close_match(a, similar_list) for a in spotify_artists_lower)

            print("RB Track Artists:", spotify_artists_lower)
            if is_preferred:
                ranked_high.append(item)
                print(" → HIGH MATCH with:", spotify_artists_lower)
            elif is_similar:
                ranked_medium.append(item)
                print(" → MEDIUM MATCH with:", spotify_artists_lower)
            else:
                ranked_low.append(item)
                print(" → LOW MATCH with:", spotify_artists_lower)
        except Exception as e:
            print("Failed to search", e)
            continue

    final_recommendations.extend(ranked_high)
    final_recommendations.extend(ranked_medium)
    final_recommendations.extend(ranked_low)

    print("Ranking summary → High:", len(ranked_high),
      "Medium:", len(ranked_medium),
      "Low:", len(ranked_low))


    if final_recommendations:
        return {"recommendations": final_recommendations}
    
    
    #fallback
    fallback = suggest_tracks_for_artist_and_mood(selected_artist_names, emotion)
    fallback_results = []

    for entry in fallback:
        search_query = f"{entry['track']} {entry['artist']}"
        try:
            fallback_search = sp.search(q=search_query,type="track",limit=10)
            items = fallback_search["tracks"]["items"]
            if items:
                tr = items[0]
                fallback_results.append(
                    {
                        "name": tr["name"],
                        "artist": tr["artists"][0]["name"],
                        "url": tr["external_urls"]["spotify"],
                        "uri": tr["uri"],
                        "duration_ms": tr["duration_ms"],
                        "image":tr["image"]
                    })
        except:
            continue
    return {"recommendations": fallback_results}
            
@app.post("/api/play")
async def play(request: Request):
    body = await request.json()
    uris = body.get("uris", [])
    token_info_json = request.cookies.get("spotify_token_info")

    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_info_json)
    result = spotify_recc.start_playback(sp, uris)
    return result

@app.get("/api/current-track")
def current_track(request: Request):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    sp = spotify_api.get_spotify_client(token_info_json)
    return spotify_recc.get_current_track(sp)

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    conversation_history: List[dict] = []
    detected_emotion: str = None

class LanguageDetectionRequest(BaseModel):
    text: str

@app.post("/api/chat")
async def chat(request: Request, chat_request: ChatRequest):
    """Chat endpoint with DJ persona and music generation"""
    try:
        # Check if user has Spotify connected
        token_info_json = request.cookies.get("spotify_token_info")
        has_spotify = token_info_json is not None
        
        # Get DJ response (potentially with music generation trigger)
        result = get_chat_response(
            message=chat_request.message,
            conversation_history=chat_request.conversation_history,
            language=chat_request.language,
            detected_emotion=chat_request.detected_emotion
        )
        
        response_data = {
            "response": result["response"],
            "playlist": None
        }
        
        # If DJ wants to generate music and user has Spotify
        if result.get("music_data") and has_spotify:
            emotion = result["music_data"]["emotion"]
            genres = result["music_data"]["genres"]
            
            try:
                sp = spotify_api.get_spotify_client(token_info_json)
                
                # Get seed tracks from Spotify
                seed_track_ids = get_spotify_seed_tracks(sp, genres=genres)
                
                if seed_track_ids:
                    # Predict features based on emotion using your ML model
                    predicted_features = predict_track_features(request.app, emotion)
                    scaler_y = request.app.state.scaler_y
                    numeric_columns = scaler_y.feature_names_in_
                    feature_params = convert_to_reccobeats(predicted_features, numeric_columns)
                    
                    # Get recommendations from ReccoBeats
                    rb_response = call_reccobeats(
                        feature_params, 
                        limit=10, 
                        seed_ids=seed_track_ids
                    )
                    
                    if rb_response and "content" in rb_response:
                        playlist = []
                        
                        for track in rb_response["content"][:10]:
                            try:
                                spotify_url = track.get("href")
                                if not spotify_url or "track/" not in spotify_url:
                                    continue
                                
                                spotify_id = spotify_url.split("track/")[-1].split("?")[0].strip()
                                if not spotify_id or len(spotify_id) < 10:
                                    continue
                                
                                # Get track details from Spotify for album art
                                try:
                                    track_details = sp.track(spotify_id)
                                    album_image = track_details['album']['images'][0]['url'] if track_details['album']['images'] else None
                                except:
                                    album_image = None
                                
                                name = track.get("trackTitle", "Unknown Track")
                                artists_data = track.get("artists", [])
                                artist_name = artists_data[0].get("name") if artists_data else "Unknown Artist"
                                
                                playlist.append({
                                    "name": name,
                                    "artists": artist_name,
                                    "url": spotify_url,
                                    "uri": f"spotify:track:{spotify_id}",
                                    "album_image": album_image,
                                    "preview_url": None
                                })
                            except Exception as e:
                                print(f"Error processing track: {e}")
                                continue
                        
                        if playlist:
                            response_data["playlist"] = playlist
                            response_data["response"] += f"\n\nCheck out these {len(playlist)} tracks I just queued up for you! 🎶"
                        else:
                            # Fallback to Spotify search
                            search_query = f"{emotion} music"
                            if genres:
                                search_query += f" {genres[0]}"
                            
                            fallback = sp.search(q=search_query, type="track", limit=10)
                            playlist = []
                            
                            for item in fallback["tracks"]["items"]:
                                playlist.append({
                                    "name": item["name"],
                                    "artists": item["artists"][0]["name"],
                                    "url": item["external_urls"]["spotify"],
                                    "uri": item["uri"],
                                    "album_image": item["album"]["images"][0]["url"] if item["album"]["images"] else None,
                                    "preview_url": item.get("preview_url")
                                })
                            
                            response_data["playlist"] = playlist
                            response_data["response"] += f"\n\nCheck out these {len(playlist)} tracks I found for you! 🎶"
                    
            except Exception as e:
                print(f"Music generation error: {e}")
                response_data["response"] += "\n\n(Had a little trouble pulling tracks from Spotify, but I'm still here to vibe with you! 🎧)"
        
        elif result.get("music_data") and not has_spotify:
            # User wants music but hasn't connected Spotify
            response_data["response"] += "\n\nYo! To get you those tracks, you'll need to connect your Spotify account first! 🎵"
        
        return response_data
        
    except Exception as e:
        print(f"Chat error: {e}")
        return JSONResponse(
            {"error": "Failed to process chat message", "response": "Yo, technical difficulties! Hit me again! 🎧"},
            status_code=500
        )

@app.post("/api/detect-language")
async def detect_language_endpoint(lang_request: LanguageDetectionRequest):
    """Detect language from text"""
    try:
        detected_lang = detect_language(lang_request.text)
        return {"language": detected_lang}
    except Exception as e:
        print(f"Language detection error: {e}")
        return {"language": "en"}  # Default to English

@app.post("/api/text-to-speech")
async def text_to_speech(request: Request):
    """
    Convert text to speech using ElevenLabs
    Returns audio stream (MP3 format)
    
    Usage: Frontend sends text, receives audio to play
    """
    try:
        data = await request.json()
        text = data.get("text", "")
        
        if not text:
            return JSONResponse({"error": "No text provided"}, status_code=400)
        
        voice_service = get_voice_service()
        if not voice_service:
            return JSONResponse(
                {"error": "Voice service not available. Check ELEVENLABS_API_KEY in .env"}, 
                status_code=503
            )
        
        # Generate audio
        audio_data = voice_service.text_to_speech(text)
        
        if not audio_data:
            return JSONResponse({"error": "Failed to generate audio"}, status_code=500)
        
        # Return audio as streaming response
        return StreamingResponse(
            BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        print(f"TTS Error: {e}")
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/api/voices")
async def get_voices():
    """
    Get available DJ voices for the chatbot
    Returns list of voice options with descriptions
    """
    voice_service = get_voice_service()
    if not voice_service:
        return JSONResponse(
            {"error": "Voice service not available"}, 
            status_code=503
        )
    
    return voice_service.get_available_voices()


@app.post("/api/change-voice")
async def change_voice(request: Request):
    """
    Change the DJ voice personality
    
    Request body:
    {
        "voice": "rachel" | "bella" | "antoni" | "josh"
    }
    """
    try:
        data = await request.json()
        voice_name = data.get("voice", "rachel")
        
        voice_service = get_voice_service()
        if not voice_service:
            return JSONResponse(
                {"error": "Voice service not available"}, 
                status_code=503
            )
        
        success = voice_service.change_voice(voice_name)
        
        if success:
            return {"message": f"Voice changed to {voice_name}", "success": True}
        else:
            return JSONResponse(
                {"error": "Invalid voice name. Choose: rachel, bella, antoni, or josh", "success": False},
                status_code=400
            )
            
    except Exception as e:
        print(f"Change voice error: {e}")
        return JSONResponse({"error": str(e), "success": False}, status_code=500)

@app.post("/api/save-playlist") 
async def save_playlist(request: Request, payload: dict = Body(...)):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return {"status": "error", "message": "Not authenticated"}
    sp = spotify_api.get_spotify_client(token_info_json)

    try:
        user = sp.current_user()
        user_id = user["id"]
    except Exception as e:
        print("Error getting user:", e)
        return {"status": "error", "message": "Unable to fetch user"}
    
    playlist_name = payload.get("playlist_name", "Mood Playlist")
    uris = payload.get("uris", [])
    if not uris:
        return {"status": "error", "message": "No tracks provided"}

    try:
        created = sp.user_playlist_create(
            user=user_id,
            name=playlist_name,
            public=False,
            description="Generated by Feed Music"
        )

        playlist_id = created["id"]
        sp.playlist_add_items(playlist_id, uris)

        return {
            "status": "success",
            "playlist_id": playlist_id,
            "playlist_url": created["external_urls"]["spotify"]
        }
    except Exception as e:
        print("Playlist creation error:", e)
        return {"status": "error", "message": "Failed to save playlist"}
    
@app.post("/api/pause")
async def pause(request: Request): 
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_info_json)
    sp.pause_playback()
    return {"status": "paused"}

@app.post("/api/resume")
async def resume(request: Request): 
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_info_json)
    sp.start_playback()
    return {"status": "playing"}

