from fastapi import FastAPI,Request,Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import spotify_recc
import spotify_api
import json
import requests #useful for recommendations from reccobeats
from app.startup import verify_load_model
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

            spotify_artists = [a["name"] for a in meta.get("artists", []) if a.get("name")]
            spotify_artists_lower = [n.lower() for n in spotify_artists]

            item = {
                "name": name,
                "artist": primary_artist_name,
                "artists_all": spotify_artists,
                "url": spotify_url,
                "uri": f"spotify:track:{spotify_id}",
                "duration_ms": meta.get("duration_ms", 0)
                }
            
            is_preferred = any(is_close_match(a, preferred_list) for a in spotify_artists_lower)
            is_similar = any(is_close_match(a, similar_list) for a in spotify_artists_lower)

            if is_preferred:
                ranked_high.append(item)
            elif is_similar:
                ranked_medium.append(item)
            else:
                ranked_low.append(item)
        except Exception as e:
            print("Failed to search", e)
            continue

    final_recommendations.extend(ranked_high)
    final_recommendations.extend(ranked_medium)
    final_recommendations.extend(ranked_low)

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
                        "duration_ms": tr["duration_ms"]
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

