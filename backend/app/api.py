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
from genre_classification import GENRE_NORMALIZATION_PROMPT
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

RECCOBEATS_BASE = "https://api.reccobeats.com/v1/track/recommendation"
MASTER_GENRES = [
     "Pop",
     "Hip-Hop",
     "R&B",
     "Rock",
     "Jazz",
     "Blues",
     "Classical",
     "Country",
     "Reggae",
     "Electronic",
     "House",
     "Techno",
     "EDM",
     "Indie",
     "Metal",
     "K-Pop",
     "Latin",
     "Folk",
     "Disco",
     "Soul",
     "Trap",
     "Gospel",
     "Afrobeats",
     "Dancehall",
     "Punk",
     "Alternative",
     "Opera",
     "Drill",
     "Synthwave",
     "Lo-fi",
]
GENRE_CACHE = {}
GENRE_CACHE_FILE = "genre_cache.json"

class EmotionInput(BaseModel):
    emotion: str
    genres: list[str] | None = None

def save_genre_cache():
    with open(GENRE_CACHE_FILE, "w") as f:
        json.dump(GENRE_CACHE, f, indent=2)

def load_genre_cache():
    global GENRE_CACHE
    if os.path.exists(GENRE_CACHE_FILE):
        with open(GENRE_CACHE_FILE, "r") as f:
            GENRE_CACHE = json.load(f)
def normalize_spotify_genres(raw_genres: set[str]) -> set[str]:
    normalized = set()
    for g in raw_genres:
        if g in GENRE_CACHE:
            normalized.add(GENRE_CACHE[g])
    return normalized

#model
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_genre_cache()

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


@app.get("/api/genres")
def get_user_genres(request: Request):
        return {"genres": MASTER_GENRES}

@app.get("/api/user-raw-genres")
def get_user_raw_genres(request: Request):
    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)

    sp = spotify_api.get_spotify_client(token_info_json)

    try:
        top_artists = sp.current_user_top_artists(limit=50, time_range="medium_term")
        micro_genres = list({genre for artist in top_artists["items"] for genre in artist["genres"]})
        return {"micro_genres": micro_genres}
    except Exception as e:
        print("Error getting raw genres:", e)
        return {"micro_genres": []}

@app.post("/api/normalize-genres")
async def normalize_genres(micro_genres: List[str]):
    global GENRE_CACHE
    to_normalize = [g for g in micro_genres if g not in GENRE_CACHE]
    if not to_normalize:
        return {"mapping": GENRE_CACHE}

    prompt = GENRE_NORMALIZATION_PROMPT.format(
        master_genres=",".join(MASTER_GENRES),
        micro_genres=",".join(to_normalize)
    )

    try:
        response = client.chat.completions.create(
            model="gpt-5",
            messages=[{"role": "user", "content": prompt}]
        )

        mapping = response.choices[0].message["content"]

        GENRE_CACHE.update(mapping)
        save_genre_cache()

        return {"mapping": GENRE_CACHE}

    except Exception as e:
        print("AI normalization error:", e)
        return {"error": "Could not normalize genres"}

def get_spotify_seed_tracks(sp,genres):
    try:
        top_tracks = sp.current_user_top_tracks(limit=50, time_range="short_term")
        all_tracks = top_tracks['items']

        if not genres:
            return [track['id'] for track in all_tracks[:5]]
        
        artist_ids = {a["id"] for t in all_tracks for a in t["artists"]}
        artists = sp.artists(list(artist_ids))

        arts = {a["id"]: set(a.get("genres", [])) for a in artists["artists"]}
        target = set(genres)

        seeds = []
        for t in all_tracks:
            if len(seeds) >= 5:
                break

            track_artist_ids = [a["id"] for a in t["artists"]]
            for aid in track_artist_ids:
                if arts.get(aid) and arts[aid].intersection(target):
                    seeds.append(t["id"])
                    break

        return seeds if seeds else [t["id"] for t in all_tracks[:5]]

    except Exception as e:
        print("Seed error:", e)
        return []
        
        '''artist_ids = set()
        for track in all_tracks:
            for artist in track['artists']:
                artist_ids.add(artist['id'])
        
        artists_data = sp.artists(list(artist_ids))
        artist_genre_map = {}
        for artist in artists_data['artists']:
            artist_genre_map[artist['id']] = set(artist['genres'])
            
        filtered_seed_ids = []
        target_genres = set(genres)

        for track in all_tracks:
            track_artist_ids = [artist['id'] for artist in track['artists']]
            
            # Check if any artist's genre intersects with the target genres
            is_genre_match = False
            for artist_id in track_artist_ids:
                if artist_genre_map.get(artist_id) and artist_genre_map.get(artist_id).intersection(target_genres):
                    is_genre_match = True
                    break
            
            if is_genre_match:
                filtered_seed_ids.append(track['id'])
                if len(filtered_seed_ids) >= 5:
                    break
        
        return filtered_seed_ids if filtered_seed_ids else [track['id'] for track in all_tracks[:5]] # Fallback to top 5
    except Exception as e:
        print(f"Error fetching Spotify top tracks for seeds:",e)
        return []'''
    
def get_track_genres(sp,track_id):
    track = sp.track(track_id)
    artist_ids = [a["id"] for a in track["artists"]]
    artists = sp.artists(artist_ids)
    raw = {g for a in artists["artists"] for g in a.get("genres", [])}
    return raw
        
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
    filtered_keys = {"energy", "valence"}
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

@app.get("/api/recommendation")
async def get_recommendations(request: Request,emotion: str = Query(..., description="The detected or confirmed emotion"),
    genres: Optional[List[str]] = Query(None, description="List of user's top genres")):

    token_info_json = request.cookies.get("spotify_token_info")
    if not token_info_json:
        return JSONResponse({"error": "Not logged in"}, status_code=401)
    
    sp = spotify_api.get_spotify_client(token_info_json)
    seed_track_ids = get_spotify_seed_tracks(sp,genres)
    if not seed_track_ids:
        return JSONResponse({"error": "Could not determine seed tracks for ReccoBeats."}, status_code=500)
    
    predicted_features = predict_track_features(app,emotion)
    scaler_y = request.app.state.scaler_y
    numeric_columns = scaler_y.feature_names_in_
    feature_params = convert_to_reccobeats(predicted_features, numeric_columns)

    rb_response = call_reccobeats(feature_params,limit=20,seed_ids = seed_track_ids)
    if not rb_response or "content" not in rb_response:
        return JSONResponse({"error": "ReccoBEats returned no tracks"}, status_code=500)
    
    #use results to search on spotify
    final_recommendations = []
    selected_genres = set(genres or [])
    genre_matched = []
    genre_unmatched = []

    for track in rb_response["content"]:
        try:
            spotify_url = track.get("href")
            if not spotify_url or "track/" not in spotify_url:
                continue
            
            spotify_id = spotify_url.split("track/")[-1].split("?")[0].strip()
            raw = get_track_genres(sp, spotify_id)
            normalized = normalize_spotify_genres(raw)
        
            name = track.get("trackTitle", "Unknown Track")
            artists_data = track.get("artists",[])
            artist_name = artists_data[0].get("name") if artists_data else "Unknown Artist"

            item = {
                "name": name,
                "artist": artist_name,
                "url": spotify_url,
                "uri": f"spotify:track:{spotify_id}",
                "track_genres": list(raw),
                "normalized_genres": list(normalized),
                "matched_genres": list(normalized & selected_genres)
                }
            
            if selected_genres and normalized & selected_genres:
                genre_matched.append(item)
            else:
                genre_unmatched.append(item)     
        except Exception as e:
            print("Failed to search", e)
            continue

    limit = 20
    if len(genre_matched) >= limit:
        final_recommendations = genre_matched[:limit]
    else:
        needed = limit - len(genre_matched)
        final_recommendations = genre_matched + genre_unmatched[:needed]

    if not final_recommendations:
            
            search_query = f"{emotion} music"
            if genres and genres:
                search_query += f" genre:{genres[0]}"

            fallback = sp.search(q=search_query,type="track",limit=10)
            final_recommendations = [
                {
                    "name": item["name"],
                    "artist": item["artists"][0]["name"],
                    "url": item["external_urls"]["spotify"],
                    "uri": item["uri"],
                }
                for item in fallback["tracks"]["items"]
            ]
    return {"recommendations": final_recommendations}
            
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

